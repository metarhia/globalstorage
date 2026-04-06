import { Emitter, generateUUID } from './metautil.js';

// crdt.js

const diff = (source, target) => {
  if (typeof source !== 'object') source = {};
  if (typeof target !== 'object') target = {};
  const delta = {};
  const sourceKeys = new Set(Object.keys(source));
  const targetKeys = new Set(Object.keys(target));

  for (const key of targetKeys) {
    if (!sourceKeys.has(key)) {
      delta[key] = target[key];
    } else if (Array.isArray(target[key]) || target[key] instanceof Set) {
      const sourceArr = Array.isArray(source[key]) ? source[key] : source[key];
      const targetArr = Array.isArray(target[key]) ? target[key] : target[key];
      const sourceSet = new Set(sourceArr);
      const targetSet = new Set(targetArr);
      const diffSet = new Set([...targetSet].filter((x) => !sourceSet.has(x)));
      if (diffSet.size > 0) {
        delta[key] = Array.from(diffSet);
      }
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      const nestedDiff = diff(source[key], target[key]);
      if (Object.keys(nestedDiff).length > 0) {
        delta[key] = nestedDiff;
      }
    } else if (source[key] !== target[key]) {
      delta[key] = target[key];
    }
  }

  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) {
      delta[key] = undefined;
    }
  }

  return delta;
};

const merge = (source, delta) => {
  if (!delta || typeof delta !== 'object') return source;
  if (source === null || typeof source !== 'object') return delta;

  const result = Array.isArray(source) ? [...source] : { ...source };

  for (const key in delta) {
    if (delta[key] === undefined) {
      delete result[key];
      continue;
    }

    if (Array.isArray(delta[key]) || delta[key] instanceof Set) {
      const sourceSet = new Set(
        Array.isArray(result[key]) ? result[key] : result[key] || [],
      );
      const deltaSet = new Set(
        Array.isArray(delta[key]) ? delta[key] : delta[key],
      );
      result[key] = Array.from(new Set([...sourceSet, ...deltaSet]));
    } else if (typeof delta[key] === 'object' && delta[key] !== null) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = merge(result[key], delta[key]);
      } else {
        result[key] = delta[key];
      }
    } else if (
      typeof delta[key] === 'number' &&
      typeof result[key] === 'number'
    ) {
      result[key] += delta[key];
    } else {
      result[key] = delta[key];
    }
  }

  return result;
};

const apply = (source, history) => {
  if (!Array.isArray(history)) return source;
  let result = { ...source };

  const handlers = {
    write: (record, state) => ({ ...state }),
    delta: (record, state) => merge(state, record.data),
    delete: (record, state) => ({ ...state, [record.key]: undefined }),
    inc: (record, state) => merge(state, { [record.key]: record.value }),
    dec: (record, state) => merge(state, { [record.key]: -record.value }),
  };

  for (const record of history) {
    if (!record || typeof record !== 'object' || !record.type) continue;
    const handler = handlers[record.type];
    if (handler) {
      result = handler(record, result);
    }
  }

  return result;
};

// contract.js

const deserializeFunction = (source) => {
  const arrowIndex = source.indexOf('=>');
  const header = source.slice(0, arrowIndex).trim();
  let body = source.slice(arrowIndex + 2).trim();
  const argsStart = header.indexOf('(');
  const argsEnd = header.lastIndexOf(')');
  const args = header.slice(argsStart + 1, argsEnd);
  if (body.startsWith('{')) body = body.slice(1, -1);
  else body = `return ${body};`;
  body = `return async (${args}) => {${body}}`;
  return new Function('reader', 'args', body)();
};

class DataReader {
  #storage;

  constructor(storage) {
    this.#storage = storage;
  }

  async get(id) {
    return this.#storage.loadData(id);
  }
}

class SmartContract {
  #storage;
  #chain;
  #proc;

  constructor(name, proc, { storage, chain }) {
    this.name = name;
    this.#storage = storage;
    this.#chain = chain;
    this.#proc = proc;
  }

  async execute(args) {
    const reader = new DataReader(this.#storage);
    try {
      const result = await this.#proc(reader, args);
      await this.#storage.saveData(args.id, result);
      return result;
    } catch (error) {
      const contract = this.name;
      const timestamp = Date.now();
      const block = { contract, args, error: error.message, timestamp };
      await this.#chain.addBlock(block);
      throw error;
    }
  }

  static async save(name, chain, proc) {
    const source = proc.toString();
    const block = { type: 'smart contract', name, source };
    const hash = await chain.addBlock(block);
    return hash;
  }

  static async load(hash, { storage, chain }) {
    const block = await chain.readBlock(hash);
    if (!block) throw new Error('Block not found');
    if (block.data.type !== 'smart contract') {
      throw new Error('Not a smart contract block');
    }
    const { name, source } = block.data;
    const proc = deserializeFunction(source);
    const contract = new SmartContract(name, proc, { storage, chain });
    return contract;
  }
}

// fsi-browser.js

const resolveDir = async (dirPath) => {
  const root = await navigator.storage.getDirectory();
  const parts = dirPath.split('/').filter(Boolean);
  let dir = root;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir;
};

const read = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await dirHandle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file.text();
};

const write = async (dir, filename, content) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};

const exists = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  try {
    await dirHandle.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
};

const remove = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  try {
    await dirHandle.removeEntry(filename);
  } catch {
    // File may not exist
  }
};

// crypto-browser.js

const PUBLIC_KEY_HEADER = '-----BEGIN PUBLIC KEY-----';
const PUBLIC_KEY_FOOTER = '-----END PUBLIC KEY-----';
const PRIVATE_KEY_HEADER = '-----BEGIN PRIVATE KEY-----';
const PRIVATE_KEY_FOOTER = '-----END PRIVATE KEY-----';

const ALG = { name: 'RSA-OAEP', hash: 'SHA-256' };

const calculateHash = async (data) => {
  const block = JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(block);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const toBase64UrlSafe = (buffer) => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const base64ToBytes = (base64) => {
  const normalized = base64.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const cleanPemKey = (pemKey, header, footer) => {
  const s = pemKey.replace(header, '').replace(footer, '');
  return s.replaceAll(/\s/g, '');
};

const generateKeys = async () => {
  const keyPair = await crypto.subtle.generateKey(
    { ...ALG, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['encrypt', 'decrypt'],
  );
  const pubBuf = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privBuf = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pub = toBase64UrlSafe(pubBuf);
  const priv = toBase64UrlSafe(privBuf);
  return {
    publicKey: [PUBLIC_KEY_HEADER, pub, PUBLIC_KEY_FOOTER].join('\n'),
    privateKey: [PRIVATE_KEY_HEADER, priv, PRIVATE_KEY_FOOTER].join('\n'),
  };
};

const importPublicKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PUBLIC_KEY_HEADER, PUBLIC_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey('spki', bytes, ALG, false, ['encrypt']);
};

const importPrivateKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey('pkcs8', bytes, ALG, false, ['decrypt']);
};

const encrypt = async (data, publicKey) => {
  const key = await importPublicKey(publicKey);
  const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
  const encryptedBuffer = await crypto.subtle.encrypt(ALG, key, dataBuffer);
  return toBase64UrlSafe(encryptedBuffer);
};

const decrypt = async (data, privateKey) => {
  const key = await importPrivateKey(privateKey);
  const bytes = base64ToBytes(data);
  const buffer = await crypto.subtle.decrypt(ALG, key, bytes);
  return JSON.parse(new TextDecoder().decode(buffer));
};

const loadKeys = async (basePath = 'keys') => {
  let publicKey, privateKey;
  if (await fsi.exists(basePath, 'public.pem')) {
    publicKey = await fsi.read(basePath, 'public.pem');
    privateKey = await fsi.read(basePath, 'private.pem');
  } else {
    const keys = await generateKeys();
    ({ publicKey, privateKey } = keys);
    await fsi.write(basePath, 'public.pem', publicKey);
    await fsi.write(basePath, 'private.pem', privateKey);
  }
  return { publicKey, privateKey };
};

// sync-browser.js

class SyncManager {
  #nodes = new Set();

  constructor() {
    return this.#init();
  }

  async #init() {
    await this.start();
    return this;
  }

  async start() {
    // TODO: Implement metacom-based sync (WebSocket client)
    // Future: WebRTC transport for peer-to-peer sync
    const uplinks = Array.from(this.#nodes).filter(
      (node) => node.type === 'uplink' && node.enabled,
    );
    if (uplinks.length === 0) return;
    for (const uplink of uplinks) {
      try {
        // Sync here
      } catch (error) {
        console.error(`Sync failed with ${uplink.url}:`, error.message);
      }
    }
  }

  async addNode(nodeData) {
    const { url, type, token } = nodeData;
    if (!url) throw new Error('Node URL is required');
    if (type !== 'uplink' && type !== 'downlink') {
      throw new Error('Node type must be uplink or downlink');
    }
    const existing = Array.from(this.#nodes).find((n) => n.url === url);
    if (existing) throw new Error(`Node with URL ${url} already exists`);
    const now = Date.now();
    const node = { type, url, token, enabled: true, lastSync: now };
    this.#nodes.add(node);
    await this.start();
  }

  async removeNode(url) {
    const node = Array.from(this.#nodes).find((n) => n.url === url);
    if (!node) throw new Error(`Node with URL ${url} not found`);
    this.#nodes.delete(node);
  }

  listNodes() {
    return Array.from(this.#nodes);
  }
}

// chain.js

const BLOCKCHAIN = '.blockchain.json';

class Blockchain {
  constructor(basePath) {
    this.path = basePath;
    this.tailHash = null;
    return this.#init();
  }

  async #init() {
    const exists = await fsi.exists(this.path, BLOCKCHAIN);
    if (!exists) {
      const block = { prev: '0', timestamp: Date.now(), data: {} };
      this.tailHash = await this.writeBlock(block);
      await this.writeChain();
    } else {
      const raw = await fsi.read(this.path, BLOCKCHAIN);
      const chain = JSON.parse(raw);
      this.tailHash = chain.tailHash;
    }
    return this;
  }

  async writeChain() {
    const chain = { tailHash: this.tailHash };
    await fsi.write(this.path, BLOCKCHAIN, JSON.stringify(chain));
  }

  async addBlock(data) {
    const prev = this.tailHash;
    const timestamp = Date.now();
    const block = { prev, timestamp, data };
    const hash = await this.writeBlock(block);
    this.tailHash = hash;
    await this.writeChain();
    return hash;
  }

  async writeBlock(block) {
    const hash = await calculateHash(block);
    await fsi.write(this.path, `${hash}.json`, JSON.stringify(block));
    return hash;
  }

  async readBlock(hash) {
    const exists = await fsi.exists(this.path, `${hash}.json`);
    if (!exists) throw new Error(`Block not found: ${hash}`);
    const raw = await fsi.read(this.path, `${hash}.json`);
    return JSON.parse(raw);
  }

  async validate({ last, from } = {}) {
    let currentHash = from || this.tailHash;
    if (!currentHash) return false;
    let count = 0;
    while (currentHash) {
      const block = await this.readBlock(currentHash);
      const expectedHash = await calculateHash(block);
      const valid = currentHash === expectedHash;
      if (!valid) return false;
      count++;
      if (last && count >= last) break;
      if (block.prev === '0') break;
      currentHash = block.prev;
    }
    return true;
  }
}

// storage.js

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
    this.#path = options.path || options.name || 'gs';
    this.#records = new Map();
    if (options.schema) this.#schema = options.schema;
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

    const hash = await calculateHash(record);
    const blockHash = await this.#chain.addBlock({ id, hash });

    const entry = { data: record, encrypted, timestamp, block: blockHash };
    await fsi.write(`${this.#path}/data`, `${id}.json`, JSON.stringify(entry));
    this.#cache.set(id, data);

    this.#updates.push({ type: 'write', id, timestamp, data });
  }

  async loadData(id) {
    if (this.#cache.has(id)) return this.#cache.get(id);
    const dataDir = `${this.#path}/data`;
    const exists = await fsi.exists(dataDir, `${id}.json`);
    if (!exists) {
      this.#cache.set(id, null);
      return null;
    }
    const raw = await fsi.read(dataDir, `${id}.json`);
    const { data, encrypted, block } = JSON.parse(raw);
    const isValid = await this.validate(id, data, block);
    if (!isValid) throw new Error(`Storage record ${id} is invalid`);
    const decrypted = encrypted ? decrypt(data, this.#keys.privateKey) : data;
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
      const expectedHash = await calculateHash(data);
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
    return fsi.exists(`${this.#path}/data`, `${id}.json`);
  }

  hasRecord(id) {
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
    await fsi.remove(`${this.#path}/data`, `${id}.json`);
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

Storage.Collection = Collection;
Storage.Record = Record;

const open = (options) => new Storage(options);

export {
  diff,
  merge,
  apply,
  DataReader,
  SmartContract,
  read,
  write,
  exists,
  remove,
  calculateHash,
  generateKeys,
  encrypt,
  decrypt,
  loadKeys,
  SyncManager,
  Blockchain,
  calculateHash,
  Storage,
  open,
};
