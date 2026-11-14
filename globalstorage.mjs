import { between, Emitter, generateUUID } from './metautil.js';

// crdt.js

const RESERVED_KEYS = ['__proto__', 'constructor', 'prototype'];
const MAX_DEPTH = 32;
const NO_CHANGE = Symbol('no change');
const NESTED = Symbol('nested map');

const isObject = (value) => {
  const isStructured = typeof value === 'object' && value !== null;
  return isStructured && !Array.isArray(value) && !(value instanceof Set);
};

const hasTag = (value, tag) => isObject(value) && Object.hasOwn(value, tag);
const isRegister = (value) => hasTag(value, '$lww');
const isCounter = (value) => hasTag(value, '$counter');
const isTagged = (value) => isRegister(value) || isCounter(value);
const isMap = (value) => isObject(value) && !isTagged(value);
const isSet = (value) => Array.isArray(value) || value instanceof Set;
const ownValue = (map, key) => (Object.hasOwn(map, key) ? map[key] : undefined);
const emptyCounter = () => ({ $counter: { inc: {}, dec: {} } });

const compareValues = (a, b) => {
  const left = JSON.stringify(a);
  const right = JSON.stringify(b);
  if (left === right) return 0;
  return left > right ? 1 : -1;
};

// Later time wins, then larger replica id, then larger value: every replica
// picks the same register whatever order deltas arrive in
const compareRegisters = (a, b) => {
  if (a.time !== b.time) return a.time - b.time;
  if (a.replica !== b.replica) return a.replica > b.replica ? 1 : -1;
  return compareValues(a.value, b.value);
};

const joinRegister = (source, delta) => {
  if (!isRegister(source)) return delta;
  const isNewer = compareRegisters(delta.$lww, source.$lww) > 0;
  return isNewer ? delta : source;
};

// Per-replica counts of target above source, null when none is above
const above = (source = {}, target = {}) => {
  let result = null;
  const keys = Object.keys(target);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const count = target[key];
    const current = ownValue(source, key) ?? 0;
    if (count <= current) continue;
    result ??= {};
    result[key] = count;
  }
  return result;
};

// Per-replica maximum, returns source itself when nothing grows
const raise = (source = {}, delta = {}) => {
  const grown = above(source, delta);
  return grown === null ? source : { ...source, ...grown };
};

const joinCounter = (source, delta) => {
  if (isRegister(source)) return source;
  const base = isCounter(source) ? source : emptyCounter();
  const before = base.$counter;
  const after = delta.$counter;
  const inc = raise(before.inc, after.inc);
  const dec = raise(before.dec, after.dec);
  const isSame = inc === before.inc && dec === before.dec;
  return isSame ? base : { $counter: { inc, dec } };
};

// Sets are kept sorted so replicas hold equal arrays whatever the order
const compareItems = (a, b) => {
  const left = typeof a;
  const right = typeof b;
  if (left !== right) return left > right ? 1 : -1;
  if (left === 'number') return a - b;
  return compareValues(a, b);
};

const union = (source, delta) => {
  const items = new Set(isSet(source) ? source : []);
  const size = items.size;
  for (const item of delta) items.add(item);
  const isSame = items.size === size && Array.isArray(source);
  return isSame ? source : Array.from(items).sort(compareItems);
};

// Patch removal: CRDT values are removed by a tombstone, not by absence
const removeValue = (value) => (isTagged(value) ? value : undefined);

// Plain values follow merge patch rules and never replace CRDT values
const join = (source, delta) => {
  if (delta === undefined) return removeValue(source);
  if (isRegister(delta)) return joinRegister(source, delta);
  if (isCounter(delta)) return joinCounter(source, delta);
  if (isTagged(source)) return source;
  if (isSet(delta)) return union(source, delta);
  if (isObject(delta)) return NESTED;
  return Object.is(source, delta) ? source : delta;
};

// Copy on write: unchanged map is returned as is, so callers can see growth
const mergeMaps = (source, delta) => {
  let result = source;
  const keys = Object.keys(delta);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const before = ownValue(source, key);
    const value = delta[key];
    let joined = join(before, value);
    if (joined === NESTED) {
      const base = isMap(before) ? before : {};
      joined = mergeMaps(base, value);
    }
    if (joined === before) continue;
    if (result === source) result = { ...source };
    if (joined === undefined) delete result[key];
    else result[key] = joined;
  }
  return result;
};

const merge = (source, delta) => {
  if (!isObject(delta)) return source;
  const base = isObject(source) ? source : {};
  return mergeMaps(base, delta);
};

const apply = (source, deltas) => {
  if (!Array.isArray(deltas)) return source;
  let result = source;
  for (let i = 0; i < deltas.length; i++) result = merge(result, deltas[i]);
  return result;
};

const diffCounter = (source, target) => {
  if (!isCounter(source)) return target;
  const before = source.$counter;
  const after = target.$counter;
  const inc = above(before.inc, after.inc);
  const dec = above(before.dec, after.dec);
  if (inc === null && dec === null) return NO_CHANGE;
  return { $counter: { inc: inc ?? {}, dec: dec ?? {} } };
};

const diffSet = (source, target) => {
  if (!isSet(source)) return Array.from(target);
  const known = new Set(source);
  const items = Array.from(new Set(target));
  const added = items.filter((item) => !known.has(item));
  return added.length > 0 ? added : NO_CHANGE;
};

const diffValue = (source, target) => {
  if (isRegister(target)) {
    const isKnown = joinRegister(source, target) === source;
    return isKnown ? NO_CHANGE : target;
  }
  if (isRegister(source)) return NO_CHANGE;
  if (isCounter(target)) return diffCounter(source, target);
  if (isCounter(source)) return NO_CHANGE;
  if (isSet(target)) return diffSet(source, target);
  if (!isObject(target)) return source === target ? NO_CHANGE : target;
  return isMap(source) ? NESTED : target;
};

const diff = (source, target) => {
  const before = isObject(source) ? source : {};
  const after = isObject(target) ? target : {};
  const delta = {};
  const keys = Object.keys(after);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = after[key];
    if (!Object.hasOwn(before, key)) {
      delta[key] = value;
      continue;
    }
    const source = before[key];
    let change = diffValue(source, value);
    if (change === NESTED) change = diff(source, value);
    const isEmpty = isObject(change) && Object.keys(change).length === 0;
    if (change !== NO_CHANGE && !isEmpty) delta[key] = change;
  }
  const previous = Object.keys(before);
  for (let i = 0; i < previous.length; i++) {
    const key = previous[i];
    const isKept = Object.hasOwn(after, key) || isTagged(before[key]);
    if (!isKept) delta[key] = undefined;
  }
  return delta;
};

const total = (counts = {}) => {
  let sum = 0;
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i++) sum += counts[keys[i]];
  return sum;
};

const materialize = (state) => {
  if (isRegister(state)) return state.$lww.value;
  if (isCounter(state)) {
    const { inc, dec } = state.$counter;
    return total(inc) - total(dec);
  }
  if (isSet(state)) return Array.from(state);
  if (!isObject(state)) return state;
  const result = {};
  const keys = Object.keys(state);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const node = state[key];
    const value = materialize(node);
    const isRemoved = value === null && isRegister(node);
    if (!isRemoved) result[key] = value;
  }
  return result;
};

const latestTime = (state) => {
  if (isRegister(state)) return state.$lww.time;
  if (!isMap(state)) return 0;
  let latest = 0;
  const keys = Object.keys(state);
  for (let i = 0; i < keys.length; i++) {
    const time = latestTime(state[keys[i]]);
    if (time > latest) latest = time;
  }
  return latest;
};

const copyValue = (value) => {
  const isStructured = typeof value === 'object' && value !== null;
  return isStructured ? structuredClone(value) : value;
};

const assign = (fields, stamp) => {
  const { time, replica } = stamp;
  const delta = {};
  const keys = Object.keys(fields);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const field = fields[key];
    if (field === undefined) continue;
    const value = copyValue(field);
    delta[key] = { $lww: { value, time, replica } };
  }
  return delta;
};

const countOf = (state, path, side, replica) => {
  let node = state;
  for (let i = 0; i < path.length; i++) {
    node = isMap(node) ? ownValue(node, path[i]) : undefined;
  }
  if (!isCounter(node)) return 0;
  const counts = node.$counter[side] ?? {};
  return ownValue(counts, replica) ?? 0;
};

// Each replica raises only its own entry: a delta carries the new total
// for this replica, so it can be merged many times and in any order
const increment = (state, path, amount, replica) => {
  const side = amount < 0 ? 'dec' : 'inc';
  const current = countOf(state, path, side, replica);
  const counter = { inc: {}, dec: {} };
  counter[side] = { [replica]: current + Math.abs(amount) };
  let delta = { $counter: counter };
  for (let i = path.length - 1; i >= 0; i--) delta = { [path[i]]: delta };
  return delta;
};

const isPrimitive = (value) => {
  const type = typeof value;
  if (type === 'number') return Number.isFinite(value);
  return value === null || type === 'string' || type === 'boolean';
};

const isPlainObject = (value) => {
  if (!isObject(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isJson = (value, depth) => {
  if (isPrimitive(value)) return true;
  if (depth > MAX_DEPTH) return false;
  if (Array.isArray(value)) return value.every((x) => isJson(x, depth + 1));
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (RESERVED_KEYS.includes(key)) return false;
    if (!isJson(value[key], depth + 1)) return false;
  }
  return true;
};

const isCounts = (counts) => {
  if (counts === undefined) return true;
  if (!isPlainObject(counts)) return false;
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const count = counts[key];
    if (RESERVED_KEYS.includes(key)) return false;
    if (!Number.isSafeInteger(count) || count < 0) return false;
  }
  return true;
};

const isValidRegister = (register, depth) => {
  if (!isPlainObject(register)) return false;
  const { value, time, replica } = register;
  const hasStamp = Number.isFinite(time) && typeof replica === 'string';
  return hasStamp && isJson(value, depth + 1);
};

const isValidCounter = (counter) => {
  if (!isPlainObject(counter)) return false;
  return isCounts(counter.inc) && isCounts(counter.dec);
};

const isLeaf = (node, depth) => {
  const isSingle = isObject(node) && Object.keys(node).length === 1;
  if (isRegister(node)) return isSingle && isValidRegister(node.$lww, depth);
  if (isCounter(node)) return isSingle && isValidCounter(node.$counter);
  return Array.isArray(node) && node.every(isPrimitive);
};

// Deltas from the network hold CRDT values only: registers, counters,
// sets of primitives, and maps of those
const isDelta = (delta, depth = 0) => {
  if (!isPlainObject(delta) || depth > MAX_DEPTH) return false;
  const keys = Object.keys(delta);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const node = delta[key];
    if (RESERVED_KEYS.includes(key)) return false;
    const isNested = isMap(node);
    if (isNested && !isDelta(node, depth + 1)) return false;
    if (!isNested && !isLeaf(node, depth)) return false;
  }
  return true;
};

// contract.js

const deserializeFunction = (source) => new Function(`return (${source});`)();

class DataReader {
  #storage = null;

  constructor(storage) {
    this.#storage = storage;
  }

  async get(id) {
    return this.#storage.loadData(id);
  }
}

class SmartContract {
  name = undefined;
  #storage = null;
  #chain = null;
  #proc = null;

  constructor(name, proc, { storage, chain = storage.chain }) {
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
    return chain.addBlock(block);
  }

  static async load(hash, { storage, chain = storage.chain }) {
    const block = await chain.readBlock(hash);
    if (block.data.type !== 'smart contract') {
      throw new Error('Not a smart contract block');
    }
    const { name, source } = block.data;
    const proc = deserializeFunction(source);
    return new SmartContract(name, proc, { storage, chain });
  }
}

// fsi-browser.js

const dirs = new Map();

const openDir = async (dirPath) => {
  let dir = await navigator.storage.getDirectory();
  for (const part of dirPath.split('/').filter(Boolean)) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir;
};

const resolveDir = (dirPath) => {
  if (!dirs.has(dirPath)) {
    const dir = openDir(dirPath);
    dir.catch(() => dirs.delete(dirPath));
    dirs.set(dirPath, dir);
  }
  return dirs.get(dirPath);
};

const ifMissing = (value) => (error) => {
  if (error.name === 'NotFoundError') return value;
  throw error;
};

const read = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await dirHandle
    .getFileHandle(filename)
    .catch(ifMissing(null));
  if (!fileHandle) return null;
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
  await dirHandle.removeEntry(filename).catch(ifMissing());
};

const list = async (dir) => {
  const dirHandle = await resolveDir(dir);
  const names = [];
  for await (const name of dirHandle.keys()) names.push(name);
  return names;
};

const fsi = { read, write, exists, remove, list };

// keys.js

// Remembers the last parsed key, storage always uses the same key pair
const memoizeLast = (fn) => {
  let lastPem = null;
  let lastKey = null;
  return (pem) => {
    if (pem !== lastPem) {
      lastKey = fn(pem);
      lastPem = pem;
    }
    return lastKey;
  };
};

// Key pair kept as PEM files, generated and written on the first use
const loadKeyPair = async (files, generateKeys, basePath) => {
  const publicKey = await files.read(basePath, 'public.pem');
  if (publicKey !== null) {
    const privateKey = await files.read(basePath, 'private.pem');
    if (privateKey === null) throw new Error(`No private key in ${basePath}`);
    return { publicKey, privateKey };
  }
  const keys = await generateKeys();
  await files.write(basePath, 'public.pem', keys.publicKey);
  await files.write(basePath, 'private.pem', keys.privateKey);
  return keys;
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

const toBase64 = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const toBase64UrlSafe = (buffer) => {
  const base64 = toBase64(buffer);
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const toPem = (header, footer, buffer) => {
  const lines = toBase64(buffer).match(/.{1,64}/g);
  return [header, ...lines, footer].join('\n');
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
  const modulusLength = 2048;
  const publicExponent = new Uint8Array([1, 0, 1]);
  const algorithm = { ...ALG, modulusLength, publicExponent };
  const keyPair = await crypto.subtle.generateKey(algorithm, true, [
    'encrypt',
    'decrypt',
  ]);
  const [pubBuf, privBuf] = await Promise.all([
    crypto.subtle.exportKey('spki', keyPair.publicKey),
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
  ]);
  return {
    publicKey: toPem(PUBLIC_KEY_HEADER, PUBLIC_KEY_FOOTER, pubBuf),
    privateKey: toPem(PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER, privBuf),
  };
};

const importPublicKey = memoizeLast(async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PUBLIC_KEY_HEADER, PUBLIC_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey('spki', bytes, ALG, false, ['encrypt']);
});

const importPrivateKey = memoizeLast(async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey('pkcs8', bytes, ALG, false, ['decrypt']);
});

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

const loadKeys = (basePath = 'keys') =>
  loadKeyPair(fsi, generateKeys, basePath);

// sync.js

const nodeFile = (url) => `${between(url, '://', ':')}.json`;

class SyncManager {
  #path = undefined;
  #nodes = new Map();

  constructor(basePath) {
    this.#path = `${basePath}/remote`;
    return this.#init();
  }

  async #init() {
    const files = await fsi.list(this.#path);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    const reads = jsonFiles.map((file) => fsi.read(this.#path, file));
    for (const raw of await Promise.all(reads)) {
      const node = JSON.parse(raw);
      this.#nodes.set(node.url, node);
    }
    await this.start();
    return this;
  }

  async start() {
    // TODO: Implement metacom-based sync
    // This would connect to the node using metacom protocol
    // and exchange CRDT delta logs for sync
    // Future: WebRTC transport for peer-to-peer sync in browser
    const uplinks = this.listNodes().filter(
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
    if (this.#nodes.has(url)) {
      throw new Error(`Node with URL ${url} already exists`);
    }
    const now = Date.now();
    const node = { type, url, token, enabled: true, lastSync: now };
    this.#nodes.set(url, node);
    await fsi.write(this.#path, nodeFile(url), JSON.stringify(node));
    await this.start();
  }

  async removeNode(url) {
    if (!this.#nodes.delete(url)) {
      throw new Error(`Node with URL ${url} not found`);
    }
    await fsi.remove(this.#path, nodeFile(url));
  }

  listNodes() {
    return [...this.#nodes.values()];
  }
}

// chain.js

const BLOCKCHAIN = '.blockchain.json';

class Blockchain {
  path = undefined;
  tailHash = null;

  constructor(basePath) {
    this.path = basePath;
    return this.#init();
  }

  async #init() {
    const raw = await fsi.read(this.path, BLOCKCHAIN);
    if (raw !== null) {
      this.tailHash = JSON.parse(raw).tailHash;
      return this;
    }
    const block = { prev: '0', timestamp: Date.now(), data: {} };
    this.tailHash = await this.writeBlock(block);
    await this.writeChain();
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
    const raw = await fsi.read(this.path, `${hash}.json`);
    if (raw === null) throw new Error(`Block not found: ${hash}`);
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

const fieldType = (def) => {
  if (typeof def === 'string') return def.startsWith('?') ? def.slice(1) : def;
  return def?.type ?? def?.one ?? def?.many;
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

const open = (options) => new Storage(options);

export {
  diff,
  merge,
  apply,
  materialize,
  latestTime,
  assign,
  increment,
  isDelta,
  DataReader,
  SmartContract,
  fsi,
  memoizeLast,
  loadKeyPair,
  calculateHash,
  generateKeys,
  encrypt,
  decrypt,
  loadKeys,
  SyncManager,
  Blockchain,
  Storage,
  open,
};
