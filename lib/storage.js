'use strict';

const { Emitter, generateUUID } = require('metautil');
const { encrypt, decrypt, loadKeys, calculateHash } = require('./crypto.js');
const { Blockchain } = require('./chain.js');
const { SyncManager } = require('./sync.js');
const { fsi } = require('./fsi.js');

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
    return this.#storage.record(this.#id);
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
      if (typeof value === 'string' && this.#storage.hasRecord(value)) {
        data[key] = new Reference(value, this.#storage);
      } else if (value && typeof value === 'object') {
        this.#convertToReferences(value);
      }
    }
  }

  get id() {
    return this.#id;
  }

  #defineProperties() {
    for (const key in this.#data) {
      if (key === 'id') continue;
      if (Object.hasOwn(this, key)) continue;
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
}

class Collection {
  #storage;
  #name;

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
  #path;
  #dataDir;
  #keys = null;
  #chain = null;
  #records = new Map();
  #sync = null;
  #updates = [];
  #cache = new Map();
  #schema = null;

  constructor(options = {}) {
    this.#path = options.path || options.name || 'gs';
    this.#dataDir = `${this.#path}/data`;
    this.#schema = options.schema || null;
    return this.#init();
  }

  async #init() {
    this.#keys = await loadKeys(`${this.#path}/keys`);
    this.#chain = await new Blockchain(`${this.#path}/blockchain`);
    this.#sync = await new SyncManager(this.#path, this, this.#chain);
    this.#initCollections();
    return this;
  }

  #initCollections() {
    const entities = this.#schema?.entities;
    if (!entities) return;
    for (const [name] of entities.entries?.() ?? Object.entries(entities)) {
      this[name] = new Collection(this, name);
    }
  }

  get schema() {
    return this.#schema;
  }

  #emitUpdate(id, data, delta) {
    this.#records.get(id)?.emit('update', data, delta);
  }

  #logDelta(id, delta) {
    const timestamp = Date.now();
    this.#updates.push({ type: 'delta', id, timestamp, data: delta });
  }

  addUpdate(update) {
    this.#updates.push(update);
  }

  async saveData(id, data, options = {}) {
    const { encrypted = false } = options;
    const record = encrypted ? await encrypt(data, this.#keys.publicKey) : data;
    const timestamp = Date.now();

    const hash = await calculateHash(record);
    const blockHash = await this.#chain.addBlock({ id, hash });

    const entry = { data: record, encrypted, timestamp, block: blockHash };
    await fsi.write(this.#dataDir, `${id}.json`, JSON.stringify(entry));
    this.#cache.set(id, data);

    this.#updates.push({ type: 'write', id, timestamp, data });
  }

  async loadData(id) {
    if (this.#cache.has(id)) return this.#cache.get(id);
    const exists = await fsi.exists(this.#dataDir, `${id}.json`);
    if (!exists) {
      this.#cache.set(id, null);
      return null;
    }
    const raw = await fsi.read(this.#dataDir, `${id}.json`);
    const { data, encrypted, block } = JSON.parse(raw);
    const isValid = await this.validate(id, data, block);
    if (!isValid) throw new Error(`Storage record ${id} is invalid`);
    const decrypted = encrypted
      ? await decrypt(data, this.#keys.privateKey)
      : data;
    this.#cache.set(id, decrypted);
    return decrypted;
  }

  async validate(idOrOptions, data, blockHash) {
    const isChainValidation =
      !data && !blockHash && ('last' in idOrOptions || 'from' in idOrOptions);
    if (isChainValidation) {
      return this.#chain.validate(idOrOptions);
    }
    const id = idOrOptions;
    try {
      const block = await this.#chain.readBlock(blockHash);
      const expectedHash = await calculateHash(data);
      return block.data.hash === expectedHash && block.data.id === id;
    } catch {
      return false;
    }
  }

  async insert(data) {
    const id = generateUUID();
    await this.saveData(id, data);
    return id;
  }

  async has(id) {
    return fsi.exists(this.#dataDir, `${id}.json`);
  }

  hasRecord(id) {
    return this.#cache.has(id) || this.#records.has(id);
  }

  async get(id) {
    return this.loadData(id);
  }

  async set(id, data) {
    const oldData = await this.get(id);
    await this.saveData(id, data);
    if (oldData) {
      const delta = calculateDelta(oldData, data);
      this.#emitUpdate(id, data, delta);
      this.#logDelta(id, delta);
    }
  }

  async delete(id) {
    await fsi.remove(this.#dataDir, `${id}.json`);
    this.#records.delete(id);
    this.#cache.delete(id);
    this.#updates.push({ type: 'delete', id, timestamp: Date.now() });
  }

  async update(id, delta) {
    const data = await this.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const updated = { ...data, ...delta };
    await this.saveData(id, updated);
    this.#emitUpdate(id, updated, delta);
    this.#logDelta(id, delta);
  }

  async swap(id, changes, prev) {
    const data = await this.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const matches = Object.keys(prev).every((key) => data[key] === prev[key]);
    if (!matches) return false;
    const updated = { ...data, ...changes };
    await this.saveData(id, updated);
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

  getCachedData(id) {
    return this.#cache.has(id) ? this.#cache.get(id) : null;
  }

  get sync() {
    return this.#sync;
  }
}

Storage.Collection = Collection;
Storage.Record = Record;

const open = (options) => new Storage(options);

module.exports = { Storage, open };
