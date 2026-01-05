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

class Record extends Emitter {
  constructor(storage, id) {
    super();
    this._storage = storage;
    this._id = id;
  }
}

class Storage {
  #path;
  #keys = null;
  #chain = null;
  #records = null;
  #sync = null;
  #basePath = null;

  constructor(options = {}) {
    this.#basePath = options.path || path.join(process.cwd(), 'gs');
    this.#records = new Map();
    return this.#init();
  }

  async #init() {
    const dataPath = path.join(this.#basePath, 'data');
    const keysPath = path.join(this.#basePath, 'keys');
    const chainPath = path.join(this.#basePath, 'blockchain');
    await fs.mkdir(dataPath, { recursive: true });
    this.#path = dataPath;
    this.#keys = await loadKeys(keysPath);
    this.#chain = await new Blockchain(chainPath);
    this.#sync = await new SyncManager(this.#basePath, this, this.#chain);
    return this;
  }

  #emitUpdate(id, data, delta) {
    const emitter = this.#records.get(id);
    if (emitter) {
      emitter.emit('update', data, delta);
    }
  }

  async saveData(id, data, options = {}) {
    const { encrypted = false } = options;
    const record = encrypted ? encrypt(data, this.#keys.publicKey) : data;
    const timestamp = Date.now();

    const hash = calculateHash(record);
    const blockHash = await this.#chain.addBlock({ id, hash });

    const entry = { data: record, encrypted, timestamp, block: blockHash };
    const filePath = path.join(this.#path, `${id}.json`);
    const raw = JSON.stringify(entry);
    await fs.writeFile(filePath, raw);
  }

  async loadData(id) {
    const filePath = path.join(this.#path, `${id}.json`);
    const exists = await fileExists(filePath);
    if (!exists) return null;
    const raw = await fs.readFile(filePath, { encoding: 'utf8' });
    const { data, encrypted, block } = JSON.parse(raw);
    const isValid = await this.validate(id, data, block);
    if (!isValid) throw new Error(`Storage record ${id} is invalid`);
    return encrypted ? decrypt(data, this.#keys.privateKey) : data;
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
    const filePath = path.join(this.#path, `${id}.json`);
    return await fileExists(filePath);
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
    }
  }

  async delete(id) {
    const filePath = path.join(this.#path, `${id}.json`);
    const exists = await fileExists(filePath);
    if (exists) {
      await fs.unlink(filePath);
      this.#records.delete(id);
    }
  }

  async update(id, delta) {
    const data = await this.get(id);
    if (!data) throw new Error(`Record ${id} not found`);
    const updated = { ...data, ...delta };
    await this.saveData(id, updated);
    this.#emitUpdate(id, updated, delta);
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

  record(id) {
    if (!this.#records.has(id)) {
      this.#records.set(id, new Record(this, id));
    }
    return this.#records.get(id);
  }

  get sync() {
    return this.#sync;
  }
}

const open = (options) => new Storage(options);

module.exports = { Storage, open };
