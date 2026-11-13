'use strict';

const { Emitter, generateUUID } = require('metautil');
const { encrypt, decrypt, loadKeys, calculateHash } = require('./crypto.js');
const { Blockchain } = require('./chain.js');
const { SyncManager } = require('./sync.js');
const { fsi } = require('./fsi.js');
const { diff } = require('./crdt.js');

const fieldType = (def) => {
  if (typeof def === 'string') return def.startsWith('?') ? def.slice(1) : def;
  return def?.type ?? def?.one ?? def?.many;
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
    const toReference = (value) =>
      typeof value === 'string' ? new Reference(value, this.#storage) : value;
    for (const key of this.#storage.referenceFields(data.$type)) {
      const value = data[key];
      if (Array.isArray(value)) data[key] = value.map(toReference);
      else data[key] = toReference(value);
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
          this.emit('update', { data: this.#data, delta });
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
    await this.#storage.update(this.#id, this.delta());
    this.#changes = {};
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
  #cache = new Map();
  #schema = null;
  #references = new Map();

  constructor(options = {}) {
    this.#path = options.path || options.name || 'gs';
    this.#dataDir = `${this.#path}/data`;
    this.#schema = options.schema || null;
    return this.#init();
  }

  async #init() {
    this.#keys = await loadKeys(`${this.#path}/keys`);
    this.#chain = await new Blockchain(`${this.#path}/blockchain`);
    this.#sync = await new SyncManager(this.#path);
    this.#initCollections();
    return this;
  }

  #initCollections() {
    const entities = this.#schema?.entities;
    if (!entities) return;
    const list = Array.from(entities.entries?.() ?? Object.entries(entities));
    const names = new Set(list.map(([name]) => name));
    for (const [name, entity] of list) {
      this[name] = new Collection(this, name);
      const fields = Object.entries(entity.fields ?? entity);
      const refs = fields.filter(([, def]) => names.has(fieldType(def)));
      this.#references.set(
        name,
        refs.map(([key]) => key),
      );
    }
  }

  referenceFields(type) {
    return this.#references.get(type) ?? [];
  }

  get schema() {
    return this.#schema;
  }

  #emitUpdate(id, data, delta) {
    this.#records.get(id)?.emit('update', { data, delta });
  }

  async #commit(id, data, delta) {
    await this.saveData(id, data);
    this.#emitUpdate(id, data, delta);
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
  }

  async loadData(id) {
    if (this.#cache.has(id)) return this.#cache.get(id);
    const raw = await fsi.read(this.#dataDir, `${id}.json`);
    if (raw === null) {
      this.#cache.set(id, null);
      return null;
    }
    const { data, encrypted, block } = JSON.parse(raw);
    const isValid = await this.#verify(id, data, block);
    if (!isValid) throw new Error(`Storage record ${id} is invalid`);
    const decrypted = encrypted
      ? await decrypt(data, this.#keys.privateKey)
      : data;
    this.#cache.set(id, decrypted);
    return decrypted;
  }

  async validate(options = {}) {
    return this.#chain.validate(options);
  }

  async #verify(id, data, blockHash) {
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
    if (oldData) await this.#commit(id, data, diff(oldData, data));
    else await this.saveData(id, data);
  }

  async delete(id) {
    await fsi.remove(this.#dataDir, `${id}.json`);
    this.#records.delete(id);
    this.#cache.delete(id);
  }

  async update(id, delta) {
    const data = await this.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    await this.#commit(id, { ...data, ...delta }, delta);
  }

  async swap(id, changes, prev) {
    const data = await this.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const matches = Object.keys(prev).every((key) => data[key] === prev[key]);
    if (!matches) return false;
    await this.#commit(id, { ...data, ...changes }, changes);
    return true;
  }

  async record(id) {
    if (!this.#records.has(id)) {
      const record = await new Record(id, this);
      this.#records.set(id, record);
    }
    return this.#records.get(id);
  }

  get chain() {
    return this.#chain;
  }

  get sync() {
    return this.#sync;
  }
}

Storage.Collection = Collection;
Storage.Record = Record;

const open = (options) => new Storage(options);

module.exports = { Storage, open };
