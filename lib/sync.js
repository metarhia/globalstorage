'use strict';

const { Emitter } = require('metautil');

const { follow, settle, report } = require('./utils.js');

const BATCH_SIZE = 256;
const MAX_PUSH = 1024;

const isEntries = (entries) => {
  if (typeof entries !== 'object' || entries === null) return false;
  const { source, deltas, position } = entries;
  const isPosition = Number.isSafeInteger(position) && position >= 0;
  return typeof source === 'string' && Array.isArray(deltas) && isPosition;
};

class SyncError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class SyncService {
  #replica = null;
  #unit = '';
  #name = '';
  #clients = new Set();
  #listener = null;
  #onClear = null;
  api = null;

  constructor(replica, options = {}) {
    this.#replica = replica;
    this.#unit = options.unit ?? 'sync';
    this.#name = options.name ?? 'downlink';
    this.#listener = (event) => this.#broadcast(event);
    // Empty log with a new source makes subscribers pull and see the clear
    this.#onClear = () => this.#broadcast({ deltas: [], position: 0 });
    replica.on('log', this.#listener);
    replica.on('clear', this.#onClear);
    this.api = {
      subscribe: (args, context) => this.#subscribe(context),
      pull: (args) => this.#pull(args),
      push: (args) => this.#push(args),
    };
  }

  // Metacom server, worker, and peer hosts give the caller as client
  async #subscribe(context) {
    await this.#replica.open();
    const client = context?.client ?? null;
    if (client === null) return false;
    if (this.#clients.has(client)) return true;
    this.#clients.add(client);
    client.on('close', () => this.#clients.delete(client));
    return true;
  }

  // Position from another replica log means nothing here: start from zero
  async #pull(args) {
    await this.#replica.open();
    const replica = this.#replica;
    const source = replica.id;
    const isKnown = args?.source === source;
    const start = isKnown ? args.position : 0;
    const { deltas, position } = replica.since(start, BATCH_SIZE);
    const more = position < replica.position;
    const { cleared } = replica;
    return { source, deltas, position, more, cleared };
  }

  async #push(args) {
    await this.#replica.open();
    const deltas = args?.deltas;
    const isValid = Array.isArray(deltas) && deltas.length <= MAX_PUSH;
    if (!isValid) throw new SyncError('Invalid deltas', 400);
    const replica = this.#replica;
    const fresh = replica.merge(deltas, this.#name);
    const { id: source, position } = replica;
    return { source, position, applied: fresh.length };
  }

  // Frozen data is serialized once by metacom for all subscribers
  #broadcast(event) {
    const name = `${this.#unit}/log`;
    const { deltas, position } = event;
    const source = this.#replica.id;
    const data = Object.freeze({ source, deltas, position });
    for (const client of this.#clients) {
      try {
        client.emit(name, data);
      } catch {
        this.#clients.delete(client);
      }
    }
  }

  close() {
    this.#replica.off('log', this.#listener);
    this.#replica.off('clear', this.#onClear);
    this.#clients.clear();
  }
}

class Uplink extends Emitter {
  #replica = null;
  #metacom = null;
  #unit = '';
  #name = '';
  #link = null;
  #isLoaded = false;
  #isStarted = false;
  #isResending = false;
  #isFollowing = false;
  #queue = Promise.resolve();
  #flushing = null;
  #isFlushRequested = false;
  #onOpen = null;
  #onLog = null;
  #onClear = null;
  #onEntries = null;

  constructor(replica, metacom, options = {}) {
    super();
    this.#replica = replica;
    this.#metacom = metacom;
    this.#unit = options.unit ?? 'sync';
    this.#name = options.name ?? 'uplink';
    this.#isFollowing = options.clear === 'follow';
    this.#link = replica.getLink(this.#name);
    this.#onOpen = () => this.#run(this.sync());
    this.#onLog = (event) => this.#changed(event);
    this.#onClear = () => this.#reset();
    this.#onEntries = (entries) => this.#run(this.#enqueue(entries));
  }

  get link() {
    return { ...this.#link };
  }

  start() {
    if (this.#isStarted) return;
    this.#isStarted = true;
    this.#metacom.on('open', this.#onOpen);
    this.#replica.on('log', this.#onLog);
    this.#replica.on('clear', this.#onClear);
    if (this.#metacom.active) this.#run(this.sync());
  }

  stop() {
    if (!this.#isStarted) return;
    this.#isStarted = false;
    this.#metacom.off('open', this.#onOpen);
    this.#replica.off('log', this.#onLog);
    this.#replica.off('clear', this.#onClear);
    this.#api()?.off('log', this.#onEntries);
  }

  async sync() {
    await this.#replica.open();
    this.#load();
    if (!this.#api()?.pull) await this.#metacom.load(this.#unit);
    const api = this.#api();
    if (!api) throw new Error(`Unit ${this.#unit} is not available`);
    const isListening = api.listeners('log').includes(this.#onEntries);
    if (!isListening) api.on('log', this.#onEntries);
    if (api.subscribe) await api.subscribe();
    await this.pull();
    return this.flush();
  }

  pull() {
    return this.#serialize(() => this.#pullAll());
  }

  flush() {
    if (this.#flushing) {
      this.#isFlushRequested = true;
      return this.#flushing;
    }
    this.#flushing = this.#flushAll();
    return this.#flushing;
  }

  #api() {
    return this.#metacom.api[this.#unit] ?? null;
  }

  #load() {
    if (this.#isLoaded) return;
    this.#isLoaded = true;
    this.#link = this.#replica.getLink(this.#name);
  }

  #reset() {
    this.#link = this.#replica.getLink(this.#name);
    this.#isResending = false;
  }

  #changed(event) {
    if (event.origin === this.#name || !this.#metacom.active) return;
    this.#run(this.flush());
  }

  // Pulls and events change the same cursor: they run one at a time
  #serialize(task) {
    const pending = this.#queue;
    const result = follow(pending, task);
    this.#queue = settle(result);
    return result;
  }

  #enqueue(entries) {
    return this.#serialize(() => this.#receive(entries));
  }

  // Event from another log or after missed entries: pull instead of apply
  async #receive(entries) {
    if (!isEntries(entries)) return;
    const isSameLog = entries.source === this.#link.source;
    if (isSameLog && this.#accept(entries)) return;
    await this.#pullAll();
    this.#run(this.flush());
  }

  async #pullAll() {
    let more = true;
    while (more) {
      const api = this.#api();
      if (!this.#metacom.active || !api?.pull) return false;
      const link = this.#link;
      const { source, pulled: position } = link;
      const reply = await api.pull({ source, position });
      if (link !== this.#link || !isEntries(reply)) return false;
      more = this.#accept(reply) && reply.more === true;
    }
    return true;
  }

  #accept(entries) {
    if (entries.source !== this.#link.source) this.#switch(entries);
    const { deltas, position } = entries;
    const link = this.#link;
    const start = position - deltas.length;
    if (start > link.pulled) return false;
    const offset = link.pulled - start;
    if (offset < deltas.length) this.#merge(deltas.slice(offset));
    if (position > link.pulled) link.pulled = position;
    this.#replica.setLink(this.#name, link);
    return true;
  }

  // Uplink has another log: following its clear empties this replica,
  // otherwise the uplink lost or replaced its log and gets everything
  #switch({ source, cleared }) {
    const previous = this.#link.source;
    const isKnown = previous !== '' && Array.isArray(cleared);
    const isCleared = isKnown && cleared.includes(previous);
    if (isCleared && this.#isFollowing) this.#run(this.#replica.clear());
    else this.#isResending = true;
    const link = this.#link;
    link.source = source;
    link.pulled = 0;
    link.pushed = 0;
  }

  // Deltas from the uplink are not pushed back to it
  #merge(deltas) {
    const replica = this.#replica;
    const link = this.#link;
    const isPushed = link.pushed === replica.position;
    replica.merge(deltas, this.#name);
    if (isPushed) link.pushed = replica.position;
  }

  async #flushAll() {
    try {
      let isDone = false;
      do {
        this.#isFlushRequested = false;
        isDone = await this.#push();
      } while (this.#isFlushRequested);
      return isDone;
    } finally {
      this.#flushing = null;
    }
  }

  async #push() {
    const replica = this.#replica;
    const link = this.#link;
    while (link.pushed < replica.position) {
      const api = this.#api();
      if (!this.#metacom.active || !api?.push) return false;
      const start = link.pushed;
      const end = Math.min(replica.position, start + BATCH_SIZE);
      const deltas = this.#collect(start, end);
      if (deltas.length > 0) await api.push({ deltas });
      if (link !== this.#link) return false;
      if (end > link.pushed) link.pushed = end;
      replica.setLink(this.#name, link);
    }
    this.#isResending = false;
    return true;
  }

  #collect(start, end) {
    const replica = this.#replica;
    const { deltas } = replica.since(start, end - start);
    if (this.#isResending) return deltas;
    const result = [];
    for (let i = 0; i < deltas.length; i++) {
      const isFromUplink = replica.origin(start + i) === this.#name;
      if (!isFromUplink) result.push(deltas[i]);
    }
    return result;
  }

  #run(promise) {
    return report(promise, this);
  }
}

module.exports = { SyncService, Uplink };
