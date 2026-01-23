'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { Emitter, fileExists, generateUUID } = require('metautil');

const { encrypt, decrypt, loadKeys } = require('./keys.js');
const { calculateHash, Blockchain } = require('./chain.js');
const { SyncManager } = require('./sync.js');

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
  #keys = null;
  #chain = null;
  #records = null;
  #sync = null;
  #updates = [];
  #cache = new Map();
  #schema = null;

  constructor(options = {}) {
    this.#path = options.path || path.join(process.cwd(), 'gs');
    this.#records = new Map();
    if (options.schema) this.#schema = options.schema;
    return this.#init();
  }

  async #init() {
    const dataPath = path.join(this.#path, 'data');
    const keysPath = path.join(this.#path, 'keys');
    const chainPath = path.join(this.#path, 'blockchain');
    await fs.mkdir(dataPath, { recursive: true });
    this.#keys = await loadKeys(keysPath);
    this.#chain = await new Blockchain(chainPath);
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
    const emitter = this.#records.get(id);
    if (emitter) {
      emitter.emit('update', data, delta);
    }
  }

  addUpdate(update) {
    this.#updates.push(update);
  }

  async saveData(id, data, options = {}) {
    const { encrypted = false } = options;
    const record = encrypted ? encrypt(data, this.#keys.publicKey) : data;
    const timestamp = Date.now();

    const hash = calculateHash(record);
    const blockHash = await this.#chain.addBlock({ id, hash });

    const entry = { data: record, encrypted, timestamp, block: blockHash };
    const dataPath = path.join(this.#path, 'data');
    const filePath = path.join(dataPath, `${id}.json`);
    const raw = JSON.stringify(entry);
    await fs.writeFile(filePath, raw);

    // Update cache
    this.#cache.set(id, data);

    this.#updates.push({ type: 'write', id, timestamp, data });
  }

  async loadData(id) {
    // Check cache first
    if (this.#cache.has(id)) {
      return this.#cache.get(id);
    }
    const dataPath = path.join(this.#path, 'data');
    const filePath = path.join(dataPath, `${id}.json`);
    const exists = await fileExists(filePath);
    if (!exists) {
      this.#cache.set(id, null);
      return null;
    }
    const raw = await fs.readFile(filePath, { encoding: 'utf8' });
    const { data, encrypted, block } = JSON.parse(raw);
    const isValid = await this.validate(id, data, block);
    if (!isValid) throw new Error(`Storage record ${id} is invalid`);
    const decrypted = encrypted ? decrypt(data, this.#keys.privateKey) : data;
    // Cache the result
    this.#cache.set(id, decrypted);
    return decrypted;
  }

  async validate(idOrOptions, data, blockHash) {
    const isChainValidation =
      !data && !blockHash && ('last' in idOrOptions || 'from' in idOrOptions);
    if (isChainValidation) {
      return await this.#chain.validate(idOrOptions);
    }
    const id = idOrOptions;
    try {
      const block = await this.#chain.readBlock(blockHash);
      const expectedHash = calculateHash(data);
      if (!block) return false;
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
    const dataPath = path.join(this.#path, 'data');
    const filePath = path.join(dataPath, `${id}.json`);
    return await fileExists(filePath);
  }

  hasRecord(id) {
    // Check if record exists in cache or records map
    return this.#cache.has(id) || this.#records.has(id);
  }

  async get(id) {
    return await this.loadData(id);
  }

  async set(id, data) {
    const oldData = await this.get(id);
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
    const dataPath = path.join(this.#path, 'data');
    const filePath = path.join(dataPath, `${id}.json`);
    const exists = await fileExists(filePath);
    if (exists) {
      await fs.unlink(filePath);
      this.#records.delete(id);
      this.#cache.delete(id);
      this.#updates.push({ type: 'delete', id, timestamp: Date.now() });
    }
  }

  async update(id, delta) {
    const data = await this.get(id);
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

const open = (options) => new Storage(options);

module.exports = { Storage, Collection, Record, open };
