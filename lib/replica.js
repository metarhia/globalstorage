'use strict';

const { Emitter, generateUUID, jsonParse } = require('metautil');

const { fsi } = require('./fsi-node.js');
const { emitError } = require('./utils.js');
const crdt = require('./crdt.js');
const { merge, materialize, latestTime, assign, increment, isDelta } = crdt;

const SEGMENT_SIZE = 256;
const META_FILE = 'meta.json';
const LINK_SAVE_DELAY_MS = 1000;
const CLEARED_LIMIT = 16;
const MAX_ID_LENGTH = 128;
const EMPTY_STATE = Object.freeze({});
const EMPTY_SET = new Set();

const follow = async (pending, task) => {
  try {
    await pending;
  } catch {
    // a failed write does not block the next one
  }
  return task();
};

const finish = async (result) => {
  try {
    await result;
  } catch {
    // keep the queue moving
  }
};

const report = async (promise, emitter) => {
  try {
    await promise;
  } catch (error) {
    emitError(emitter, error);
  }
};

const isId = (value) => {
  const isString = typeof value === 'string';
  return isString && value.length > 0 && value.length <= MAX_ID_LENGTH;
};

const isEnvelope = (delta) => {
  if (typeof delta !== 'object' || delta === null) return false;
  const { id, entity, target, data } = delta;
  const isEntity = typeof entity === 'string' && entity.length <= MAX_ID_LENGTH;
  return isId(id) && isId(target) && isEntity && isDelta(data);
};

const segmentOf = (position) => Math.floor(position / SEGMENT_SIZE);
const segmentFile = (index) => `${index}.json`;

const countSegments = (names) => {
  const files = new Set(names);
  let count = 0;
  while (files.has(segmentFile(count))) count++;
  return count;
};

const createLink = () => ({ source: '', pulled: 0, pushed: 0 });

const toLink = (data) => {
  const link = createLink();
  if (typeof data !== 'object' || data === null) return link;
  const { source, pulled, pushed } = data;
  if (typeof source === 'string') link.source = source;
  if (Number.isSafeInteger(pulled) && pulled > 0) link.pulled = pulled;
  if (Number.isSafeInteger(pushed) && pushed > 0) link.pushed = pushed;
  return link;
};

class Replica extends Emitter {
  #path = '';
  #logPath = '';
  #validate = null;
  #id = '';
  #isOpen = false;
  #opening = null;
  #states = new Map();
  #values = new Map();
  #entities = new Map();
  #log = [];
  #origins = [];
  #links = new Map();
  #cleared = [];
  #clock = 0;
  #dirty = new Set();
  #isMetaDirty = false;
  #saving = Promise.resolve();
  #scheduled = null;
  #linkTimer = null;

  constructor(options = {}) {
    super();
    this.#path = options.path ?? '';
    this.#logPath = `${this.#path}/log`;
    this.#validate = options.validate ?? null;
    this.#id = generateUUID();
    if (this.#path !== '') return;
    this.#isOpen = true;
    this.#opening = Promise.resolve(this);
  }

  get id() {
    return this.#id;
  }

  get position() {
    return this.#log.length;
  }

  get size() {
    return this.#values.size;
  }

  // Ids of logs this replica cleared on purpose, the latest last
  get cleared() {
    return this.#cleared.slice();
  }

  open() {
    this.#opening ??= this.#load();
    return this.#opening;
  }

  async #load() {
    const reading = fsi.read(this.#path, META_FILE);
    const names = await fsi.list(this.#logPath);
    const count = countSegments(names);
    const reads = new Array(count).fill(null);
    for (let i = 0; i < count; i++) {
      reads[i] = fsi.read(this.#logPath, segmentFile(i));
    }
    const raw = await reading;
    const meta = raw === null ? null : jsonParse(raw);
    const isKnown = meta !== null && isId(meta.id);
    if (isKnown) this.#restoreMeta(meta);
    const segments = await Promise.all(reads);
    for (let i = 0; i < segments.length; i++) {
      const isComplete = this.#restoreSegment(segments[i]);
      if (!isComplete) break;
    }
    const isLost = isKnown && meta.position > this.#log.length;
    if (!isKnown || isLost) this.#reset();
    this.#isOpen = true;
    if (this.#isMetaDirty) this.#schedule();
    return this;
  }

  #restoreMeta(meta) {
    this.#id = meta.id;
    const cleared = Array.isArray(meta.cleared) ? meta.cleared : [];
    this.#cleared = cleared.filter(isId).slice(-CLEARED_LIMIT);
    const links = meta.links ?? {};
    const names = Object.keys(links);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const link = toLink(links[name]);
      link.pushed = Math.min(link.pushed, meta.position ?? 0);
      this.#links.set(name, link);
    }
  }

  // Positions are known to other replicas: stored entries are replayed as is
  #restoreSegment(raw) {
    const entries = raw === null ? null : jsonParse(raw);
    if (!Array.isArray(entries)) return false;
    for (let i = 0; i < entries.length; i++) {
      const delta = entries[i];
      if (!isEnvelope(delta)) return false;
      this.#apply(delta);
      this.#log.push(delta);
      this.#origins.push('');
    }
    return entries.length === SEGMENT_SIZE;
  }

  // Lost log tail: new identity makes other replicas pull and push again
  #reset() {
    this.#id = generateUUID();
    this.#links.clear();
    this.#isMetaDirty = true;
  }

  #assertOpen() {
    if (!this.#isOpen) throw new Error('Replica is not open');
  }

  get(target) {
    return this.#values.get(target) ?? null;
  }

  state(target) {
    return this.#states.get(target) ?? null;
  }

  // Record ids of one entity, or all ids; the first delta sets the entity
  keys(entity) {
    if (entity === undefined) return this.#values.keys();
    const targets = this.#entities.get(entity) ?? EMPTY_SET;
    return targets.values();
  }

  since(position = 0, limit = Infinity) {
    const length = this.#log.length;
    const isPosition = Number.isSafeInteger(position) && position > 0;
    const start = isPosition ? Math.min(position, length) : 0;
    const deltas = this.#log.slice(start, start + limit);
    return { deltas, position: start + deltas.length };
  }

  origin(position) {
    const isKnown = position >= 0 && position < this.#origins.length;
    return isKnown ? this.#origins[position] : '';
  }

  assign(entity, target, fields) {
    this.#assertOpen();
    const data = assign(fields, this.#stamp());
    return this.#commit(entity, target, data);
  }

  increment(entity, target, path, amount = 1) {
    this.#assertOpen();
    const state = this.#states.get(target);
    const data = increment(state, path, amount, this.#id);
    return this.#commit(entity, target, data);
  }

  merge(deltas, origin = '') {
    this.#assertOpen();
    if (!Array.isArray(deltas)) return [];
    const fresh = [];
    for (let i = 0; i < deltas.length; i++) {
      const delta = this.#accept(deltas[i]);
      if (delta === null || !this.#apply(delta)) continue;
      this.#log.push(delta);
      this.#origins.push(origin);
      fresh.push(delta);
    }
    if (fresh.length > 0) this.#publish(fresh, origin);
    return fresh;
  }

  // Hybrid clock: own writes are later than every write seen here
  #stamp() {
    const time = Math.max(Date.now(), this.#clock + 1);
    this.#clock = time;
    return { time, replica: this.#id };
  }

  #commit(entity, target, data) {
    const id = generateUUID();
    const fresh = this.merge([{ id, entity, target, data }]);
    return fresh.length > 0 ? fresh[0] : null;
  }

  #accept(delta) {
    if (!isEnvelope(delta)) return null;
    const { id, entity, target, data } = delta;
    const envelope = { id, entity, target, data };
    const isValid = this.#validate === null || this.#validate(envelope);
    return isValid ? envelope : null;
  }

  // Delta that adds nothing to the state is not logged, so it does not loop
  #apply(delta) {
    const { target, data } = delta;
    const state = this.#states.get(target) ?? EMPTY_STATE;
    const next = merge(state, data);
    if (next === state) return false;
    if (!this.#states.has(target)) this.#addEntity(delta);
    this.#states.set(target, next);
    this.#values.set(target, materialize(next));
    const time = latestTime(data);
    if (time > this.#clock) this.#clock = time;
    return true;
  }

  #addEntity({ entity, target }) {
    const targets = this.#entities.get(entity);
    if (targets) targets.add(target);
    else this.#entities.set(entity, new Set([target]));
  }

  #publish(deltas, origin) {
    const position = this.#log.length;
    const first = segmentOf(position - deltas.length);
    const last = segmentOf(position - 1);
    for (let i = first; i <= last; i++) this.#dirty.add(i);
    this.#isMetaDirty = true;
    this.#schedule();
    const event = { deltas, position, origin };
    report(this.emit('log', event), this);
  }

  getLink(name) {
    const link = this.#links.get(name);
    return link ? { ...link } : createLink();
  }

  // Cursors are saved later or with the next log write: a stale cursor
  // only makes a link pull or push deltas again
  setLink(name, link) {
    this.#links.set(name, toLink(link));
    this.#isMetaDirty = true;
    if (this.#path === '' || this.#linkTimer !== null) return;
    const save = () => {
      this.#linkTimer = null;
      this.#schedule();
    };
    this.#linkTimer = setTimeout(save, LINK_SAVE_DELAY_MS);
    if (typeof this.#linkTimer.unref === 'function') this.#linkTimer.unref();
  }

  async clear() {
    if (!this.#isOpen) await this.open();
    this.#states.clear();
    this.#values.clear();
    this.#entities.clear();
    this.#log = [];
    this.#origins = [];
    this.#dirty.clear();
    this.#cleared.push(this.#id);
    if (this.#cleared.length > CLEARED_LIMIT) this.#cleared.shift();
    this.#reset();
    report(this.emit('clear'), this);
    if (this.#path === '') return;
    const removing = this.#enqueue(() => this.#removeFiles());
    await removing;
    await this.save();
  }

  // Saves requested before a write starts share it, the write reads the
  // latest state; writes never overlap
  save() {
    if (this.#path === '') return Promise.resolve();
    if (this.#scheduled) return this.#scheduled;
    const scheduled = this.#enqueue(() => {
      this.#scheduled = null;
      return this.#write();
    });
    this.#scheduled = scheduled;
    return scheduled;
  }

  #enqueue(task) {
    const pending = this.#saving;
    const result = follow(pending, task);
    this.#saving = finish(result);
    return result;
  }

  #schedule() {
    if (this.#path === '' || this.#scheduled) return;
    report(this.save(), this);
  }

  async #write() {
    const segments = Array.from(this.#dirty);
    const isMetaDirty = this.#isMetaDirty;
    this.#dirty.clear();
    this.#isMetaDirty = false;
    try {
      for (let i = 0; i < segments.length; i++) {
        await this.#writeSegment(segments[i]);
      }
      if (isMetaDirty) await fsi.write(this.#path, META_FILE, this.#meta());
    } catch (error) {
      for (let i = 0; i < segments.length; i++) this.#dirty.add(segments[i]);
      if (isMetaDirty) this.#isMetaDirty = true;
      throw error;
    }
  }

  #writeSegment(index) {
    const start = index * SEGMENT_SIZE;
    const entries = this.#log.slice(start, start + SEGMENT_SIZE);
    const data = JSON.stringify(entries);
    return fsi.write(this.#logPath, segmentFile(index), data);
  }

  #meta() {
    const links = Object.fromEntries(this.#links);
    const { length: position } = this.#log;
    const cleared = this.#cleared;
    const meta = { id: this.#id, position, cleared, links };
    return JSON.stringify(meta);
  }

  // Entries merged while files were removed are written again
  async #removeFiles() {
    const names = await fsi.list(this.#logPath);
    for (let i = 0; i < names.length; i++) {
      await fsi.remove(this.#logPath, names[i]);
    }
    await fsi.remove(this.#path, META_FILE);
    const count = segmentOf(this.#log.length - 1) + 1;
    for (let i = 0; i < count; i++) this.#dirty.add(i);
    this.#isMetaDirty = true;
  }
}

module.exports = { Replica };
