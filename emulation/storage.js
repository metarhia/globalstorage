'use strict';

const { Emitter, generateUUID } = require('metautil');
const { getInitialDataWithIds } = require('./data.js');

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
  #id = undefined;
  #storage = null;

  constructor(id, storage) {
    this.#id = id;
    this.#storage = storage;
  }

  async record() {
    return this.#storage.record(this.#id);
  }
}

class Record extends Emitter {
  #id = undefined;
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
    const rawData = await this.#storage.get(this.#id);
    if (rawData) {
      this.#data = JSON.parse(JSON.stringify(rawData));
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
      if (key === 'id' || Object.hasOwn(this, key)) continue;
      Object.defineProperty(this, key, {
        get() {
          return this.#data?.[key];
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
    await this.#storage.saveData(this.#id, this.#data);
    this.#changes = {};
    this.#storage.addDelta(this.#id, delta);
  }

  async delete() {
    await this.#storage.delete(this.#id);
    this.#data = null;
    this.#changes = {};
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

class Collection {
  #storage = null;
  #name = undefined;

  constructor(storage, name) {
    this.#storage = storage;
    this.#name = name;
  }

  get name() {
    return this.#name;
  }

  async insert(data) {
    const id = generateUUID();
    const record = { ...data, $type: this.#name };
    await this.#storage.saveData(id, record);
    return this.#storage.record(id);
  }

  async get(id) {
    return this.#storage.get(id);
  }

  async delete(id) {
    return this.#storage.delete(id);
  }

  async update(id, delta) {
    return this.#storage.update(id, delta);
  }

  async record(id) {
    return this.#storage.record(id);
  }
}

class Storage {
  static Collection = Collection;
  static Record = Record;

  #data = new Map();
  #records = new Map();
  #sync = null;
  #cache = new Map();
  #updates = [];
  #schema = null;

  constructor(options = {}) {
    if (options.schema) this.#schema = options.schema;
    this.#sync = new SyncManager();
    return this.#init();
  }

  async #init() {
    const { data } = getInitialDataWithIds();
    for (const id in data) {
      const item = data[id];
      this.#data.set(id, item);
      this.#cache.set(id, item);
    }
    this.#initCollections();
    return this;
  }

  #initCollections() {
    const entities = this.#schema?.entities;
    if (!entities) return;
    const names = entities.keys?.() ?? Object.keys(entities);
    for (const name of names) this[name] = new Collection(this, name);
  }

  get schema() {
    return this.#schema;
  }

  #emitUpdate(id, data, delta) {
    this.#records.get(id)?.emit('update', data, delta);
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

  async loadData(id) {
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

  async get(id) {
    return this.loadData(id);
  }

  getCachedData(id) {
    return this.#cache.has(id) ? this.#cache.get(id) : null;
  }

  hasRecord(id) {
    return this.#cache.has(id) || this.#records.has(id);
  }

  addDelta(id, data) {
    const timestamp = Date.now();
    this.#updates.push({ type: 'delta', id, timestamp, data });
  }

  async set(id, data) {
    const oldData = this.#data.get(id);
    await this.saveData(id, data);
    if (!oldData) return;
    const delta = calculateDelta(oldData, data);
    this.#emitUpdate(id, data, delta);
    this.addDelta(id, delta);
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
    this.addDelta(id, delta);
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
      const record = await new Record(id, this);
      this.#records.set(id, record);
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
