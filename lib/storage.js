'use strict';

const { Emitter, generateUUID } = require('metautil');

const cryptoNode = require('./crypto-node.js');
const { Blockchain } = require('./chain.js');
const { fsi } = require('./fsi-node.js');
const { diff } = require('./crdt.js');
const { calculateHash, encrypt, decrypt, loadKeys } = cryptoNode;

const fieldType = (def) => {
  if (typeof def === 'string') return def.startsWith('?') ? def.slice(1) : def;
  return def?.type ?? def?.one ?? def?.many;
};

const pairsOf = (record) => {
  const hasEntries = typeof record.entries === 'function';
  if (hasEntries) return Array.from(record.entries());
  const names = Object.keys(record);
  const pairs = new Array(names.length).fill(null);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    pairs[i] = [name, record[name]];
  }
  return pairs;
};

const matchesFields = (data, fields) => {
  const keys = Object.keys(fields);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (data[key] !== fields[key]) return false;
  }
  return true;
};

const referenceNames = (entity, names) => {
  const fields = pairsOf(entity.fields ?? entity);
  const refs = [];
  for (let i = 0; i < fields.length; i++) {
    const pair = fields[i];
    const key = pair[0];
    const def = pair[1];
    if (names.has(fieldType(def))) refs.push(key);
  }
  return refs;
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
    const toReference = (value) => {
      if (typeof value !== 'string') return value;
      return new Reference(value, this.#storage);
    };
    const keys = this.#storage.referenceFields(data.$type);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = data[key];
      if (Array.isArray(value)) data[key] = value.map(toReference);
      else data[key] = toReference(value);
    }
  }

  get id() {
    return this.#id;
  }

  #defineProperties() {
    const keys = Object.keys(this.#data);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
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

  #path = 'gs';
  #dataDir = 'gs/data';
  #keys = null;
  #chain = null;
  #records = new Map();
  #cache = new Map();
  #schema = null;
  #references = new Map();

  constructor(options = {}) {
    const path = options.path || options.name || 'gs';
    this.#path = path;
    this.#dataDir = `${path}/data`;
    this.#schema = options.schema || null;
    return this.#init();
  }

  async #init() {
    this.#keys = await loadKeys(`${this.#path}/keys`);
    this.#chain = await new Blockchain(`${this.#path}/blockchain`);
    this.#initCollections();
    return this;
  }

  #initCollections() {
    const entities = this.#schema?.entities;
    if (!entities) return;
    const pairs = pairsOf(entities);
    const names = new Set();
    for (let i = 0; i < pairs.length; i++) names.add(pairs[i][0]);
    for (let i = 0; i < pairs.length; i++) {
      const name = pairs[i][0];
      const entity = pairs[i][1];
      this[name] = new Collection(this, name);
      const refs = referenceNames(entity, names);
      this.#references.set(name, refs);
    }
  }

  referenceFields(type) {
    return this.#references.get(type) ?? [];
  }

  get schema() {
    return this.#schema;
  }

  async #commit(id, data, delta) {
    await this.saveData(id, data);
    this.#records.get(id)?.emit('update', { data, delta });
  }

  async #getExisting(id) {
    const data = await this.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    return data;
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
    const { privateKey } = this.#keys;
    const decrypted = encrypted ? await decrypt(data, privateKey) : data;
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
    const data = await this.#getExisting(id);
    await this.#commit(id, { ...data, ...delta }, delta);
  }

  async swap(id, changes, prev) {
    const data = await this.#getExisting(id);
    if (!matchesFields(data, prev)) return false;
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
}

const open = (options) => new Storage(options);

module.exports = { Storage, open };
