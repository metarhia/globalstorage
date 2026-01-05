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

class Reference {
  #id;
  #storage = null;

  constructor(id, storage) {
    this.#id = id;
    this.#storage = storage;
  }

  async record() {
    return await this.#storage.record(this.#id);
  }
}

class Record extends Emitter {
  #id;
  #storage = null;
  #data = null;
  #changes = {};

  constructor(id, storage) {
    super();
    this.#id = id;
    this.#storage = storage;
    return this.#load();
  }

  async #load() {
    if (this.#data !== null) return this;
    this.#data = await this.#storage.get(this.#id);
    if (this.#data) {
      this.#convertToReferences(this.#data);
      this.#defineProperties();
    }
    return this;
  }

  #convertToReferences(data) {
    if (!data || typeof data !== 'object') return;
    for (const key in data) {
      const value = data[key];
      if (typeof value === 'string') {
        if (this.#storage.hasRecord(value)) {
          data[key] = new Reference(value, this.#storage);
        }
      } else if (value && typeof value === 'object') {
        const isReference = value instanceof Reference;
        if (!isReference) {
          this.#convertToReferences(value);
        }
      }
    }
  }

  get id() {
    return this.#id;
  }

  #defineProperties() {
    for (const key in this.#data) {
      if (key === 'id') continue;
      if (Object.prototype.hasOwnProperty.call(this, key)) continue;
      Object.defineProperty(this, key, {
        get() {
          const value = this.#data?.[key];
          if (value instanceof Reference) {
            return value;
          }
          return value;
        },
        set(newValue) {
          const oldValue = this.#data?.[key];
          if (oldValue === newValue) return;
          this.#data[key] = newValue;
          this.#changes[key] = newValue;
          const delta = { [key]: newValue };
          this.emit('update', this.#data, delta);
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  async data() {
    return this.#data;
  }

  delta() {
    return { ...this.#changes };
  }

  async save() {
    if (Object.keys(this.#changes).length === 0) return;
    const delta = this.delta();
    const data = this.#data;
    await this.#storage.saveData(this.#id, data);
    this.#changes = {};
    this.#storage.addUpdate({
      type: 'delta',
      id: this.#id,
      timestamp: Date.now(),
      data: delta,
    });
  }

  async delete() {
    await this.#storage.delete(this.#id);
    this.#data = null;
    this.#changes = {};
  }

  async ensureLoaded() {
    if (this.#data !== null) return this;
    return await this.#load();
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
  #cache = new Map();
  #updates = [];

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
      this.#cache.set(id, item);
    }
    return this;
  }

  #emitUpdate(id, data, delta) {
    const emitter = this.#records.get(id);
    if (emitter) {
      emitter.emit('update', data, delta);
    }
  }

  // eslint-disable-next-line no-unused-vars
  async saveData(id, data, options = {}) {
    this.#data.set(id, { ...data });
    this.#cache.set(id, data);
    this.#updates.push({ type: 'write', id, timestamp: Date.now(), data });
  }

  async insert(data) {
    const id = generateUUID();
    await this.saveData(id, data);
    return id;
  }

  async has(id) {
    return this.#data.has(id);
  }

  async get(id) {
    if (this.#cache.has(id)) {
      return this.#cache.get(id);
    }
    const data = this.#data.get(id);
    if (data) {
      this.#cache.set(id, data);
      return { ...data };
    }
    this.#cache.set(id, null);
    return null;
  }

  getCachedData(id) {
    return this.#cache.has(id) ? this.#cache.get(id) : null;
  }

  hasRecord(id) {
    return this.#cache.has(id) || this.#records.has(id);
  }

  addUpdate(update) {
    this.#updates.push(update);
  }

  async set(id, data) {
    const oldData = this.#data.get(id);
    await this.saveData(id, data);
    if (oldData) {
      const delta = calculateDelta(oldData, data);
      this.#emitUpdate(id, data, delta);
      this.#updates.push({
        type: 'delta',
        id,
        timestamp: Date.now(),
        data: delta,
      });
    }
  }

  async delete(id) {
    this.#data.delete(id);
    this.#records.delete(id);
    this.#cache.delete(id);
    this.#updates.push({ type: 'delete', id, timestamp: Date.now() });
  }

  async update(id, delta) {
    const data = this.#data.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const updated = { ...data, ...delta };
    await this.saveData(id, updated);
    this.#emitUpdate(id, updated, delta);
    this.#updates.push({
      type: 'delta',
      id,
      timestamp: Date.now(),
      data: delta,
    });
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

  async record(id) {
    if (!this.#records.has(id)) {
      const recordPromise = new Record(id, this);
      const record = await recordPromise;
      this.#records.set(id, record);
      return record;
    }
    const record = this.#records.get(id);
    await record.ensureLoaded();
    return record;
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
