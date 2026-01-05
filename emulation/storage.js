'use strict';

const { Emitter, generateUUID } = require('metautil');

const calculateDelta = (oldData, newData) => {
  const delta = {};
  for (const key in newData) {
    if (oldData[key] !== newData[key]) {
      delta[key] = newData[key];
    }
  }
  return delta;
};

class Record extends Emitter {
  constructor(storage, id) {
    super();
    this._storage = storage;
    this._id = id;
  }
}

class SyncManager {
  #nodes = new Set();

  async addNode(nodeData) {
    const { url, type, token } = nodeData;
    if (!url) throw new Error('Node URL is required');
    if (type !== 'uplink' && type !== 'downlink') {
      throw new Error('Node type must be uplink or downlink');
    }
    const now = Date.now();
    const node = { type, url, token, enabled: true, lastSync: now };
    this.#nodes.add(node);
  }

  async removeNode(url) {
    const node = Array.from(this.#nodes).find((n) => n.url === url);
    if (!node) throw new Error(`Node with URL ${url} not found`);
    this.#nodes.delete(node);
  }

  listNodes() {
    return Array.from(this.#nodes);
  }

  // eslint-disable-next-line class-methods-use-this
  async start() {
    return Promise.resolve();
  }
}

class Storage {
  #data = new Map();
  #records = new Map();
  #sync = null;

  // eslint-disable-next-line no-unused-vars
  constructor(options = {}) {
    this.#sync = new SyncManager();
    return this.#init();
  }

  async #init() {
    const { getInitialDataWithIds } = require('./data.js');
    const { data } = getInitialDataWithIds();
    for (const [id, item] of Object.entries(data)) {
      this.#data.set(id, item);
    }
    return this;
  }

  #emitUpdate(id, data, delta) {
    const emitter = this.#records.get(id);
    if (emitter) {
      emitter.emit('update', data, delta);
    }
  }

  async insert(data) {
    const id = generateUUID();
    this.#data.set(id, { ...data });
    return id;
  }

  async has(id) {
    return this.#data.has(id);
  }

  async get(id) {
    const data = this.#data.get(id);
    return data ? { ...data } : null;
  }

  async set(id, data) {
    const oldData = this.#data.get(id);
    this.#data.set(id, { ...data });
    if (oldData) {
      const delta = calculateDelta(oldData, data);
      this.#emitUpdate(id, data, delta);
    }
  }

  async delete(id) {
    this.#data.delete(id);
    this.#records.delete(id);
  }

  async update(id, delta) {
    const data = this.#data.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const updated = { ...data, ...delta };
    this.#data.set(id, updated);
    this.#emitUpdate(id, updated, delta);
  }

  async swap(id, changes, prev) {
    const data = this.#data.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const matches = Object.keys(prev).every((key) => data[key] === prev[key]);
    if (!matches) return false;
    const updated = { ...data, ...changes };
    this.#data.set(id, updated);
    this.#emitUpdate(id, updated, changes);
    return true;
  }

  record(id) {
    if (!this.#records.has(id)) {
      this.#records.set(id, new Record(this, id));
    }
    return this.#records.get(id);
  }

  // eslint-disable-next-line no-unused-vars
  async validate(idOrOptions, _data, _blockHash) {
    if (typeof idOrOptions === 'object' && idOrOptions !== null) {
      return true;
    }
    const id = idOrOptions;
    return this.#data.has(id);
  }

  get sync() {
    return this.#sync;
  }
}

const open = async (options = {}) => new Storage(options);

module.exports = { Storage, open, SyncManager };
