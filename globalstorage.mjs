import { Emitter, generateUUID, jsonParse } from './metautil.js';

// utils.js

// Emitter throws on error event without listeners
const emitError = (emitter, error) => {
  if (emitter.listenerCount('error') > 0) emitter.emit('error', error);
};

const follow = async (pending, task) => {
  try {
    await pending;
  } catch {
    // a failed step does not block the next one
  }
  return task();
};

const settle = async (promise) => {
  try {
    await promise;
  } catch {
    // keep the queue moving
  }
};

const report = async (promise, emitter) => {
  try {
    await promise;
  } catch (error) {
    emitError(emitter, error);
  }
};

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

const addAll = (items, values) => {
  if (Array.isArray(values)) {
    for (let i = 0; i < values.length; i++) items.add(values[i]);
    return;
  }
  for (const item of values) items.add(item);
};

const union = (source, delta) => {
  const items = new Set(isSet(source) ? source : []);
  const size = items.size;
  addAll(items, delta);
  const isSame = items.size === size && Array.isArray(source);
  return isSame ? source : Array.from(items).toSorted(compareItems);
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

// Absence removes the key; storing undefined would keep it for later diffs
const omitKey = (record, key) => {
  const next = {};
  const names = Object.keys(record);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name !== key) next[name] = record[name];
  }
  return next;
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
    if (joined === undefined) {
      result = omitKey(result, key);
      continue;
    }
    if (result === source) result = { ...source };
    result[key] = joined;
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
    const current = before[key];
    let change = diffValue(current, value);
    if (change === NESTED) change = diff(current, value);
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
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!isJson(value[i], depth + 1)) return false;
    }
    return true;
  }
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
  const parts = dirPath.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir;
};

const cacheDir = async (dirPath) => {
  try {
    return await openDir(dirPath);
  } catch (error) {
    dirs.delete(dirPath);
    throw error;
  }
};

const resolveDir = (dirPath) => {
  if (!dirs.has(dirPath)) dirs.set(dirPath, cacheDir(dirPath));
  return dirs.get(dirPath);
};

const ifMissing = (error, value) => {
  if (error.name === 'NotFoundError') return value;
  throw error;
};

const openFile = async (dirHandle, filename) => {
  try {
    return await dirHandle.getFileHandle(filename);
  } catch (error) {
    return ifMissing(error, null);
  }
};

const read = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await openFile(dirHandle, filename);
  if (fileHandle === null) return null;
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
  } catch (error) {
    ifMissing(error, undefined);
  }
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

const PEM_BOUNDARY = /-----(BEGIN|END) [A-Z ]+-----/g;
const PEM_LINE = /.{1,64}/g;

const ALG = { name: 'RSA-OAEP', hash: 'SHA-256' };

const toHex = (byte) => byte.toString(16).padStart(2, '0');

const calculateHash = async (data) => {
  const block = JSON.stringify(data);
  const input = new TextEncoder().encode(block);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes, toHex).join('');
};

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const toBase64UrlSafe = (buffer) => {
  const base64 = toBase64(buffer);
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const toPem = (label, buffer) => {
  const body = toBase64(buffer).match(PEM_LINE) ?? [];
  const header = `-----BEGIN ${label}-----`;
  const footer = `-----END ${label}-----`;
  const lines = [header].concat(body, [footer]);
  return lines.join('\n');
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

const pemToBytes = (pemKey) => {
  const stripped = pemKey.replaceAll(PEM_BOUNDARY, '');
  const base64 = stripped.replaceAll(/\s/g, '');
  return base64ToBytes(base64);
};

const generateKeys = async () => {
  const modulusLength = 2048;
  const publicExponent = new Uint8Array([1, 0, 1]);
  const algorithm = { ...ALG, modulusLength, publicExponent };
  const usages = ['encrypt', 'decrypt'];
  const keyPair = await crypto.subtle.generateKey(algorithm, true, usages);
  const publicExport = crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateExport = crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const exported = await Promise.all([publicExport, privateExport]);
  const publicBytes = exported[0];
  const privateBytes = exported[1];
  const publicKey = toPem('PUBLIC KEY', publicBytes);
  const privateKey = toPem('PRIVATE KEY', privateBytes);
  return { publicKey, privateKey };
};

const importPublicKey = memoizeLast(async (pemKey) => {
  const bytes = pemToBytes(pemKey);
  return crypto.subtle.importKey('spki', bytes, ALG, false, ['encrypt']);
});

const importPrivateKey = memoizeLast(async (pemKey) => {
  const bytes = pemToBytes(pemKey);
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

// replica.js

const { merge, materialize, latestTime, assign, increment, isDelta } = crdt;

const SEGMENT_SIZE = 256;
const META_FILE = 'meta.json';
const LINK_SAVE_DELAY_MS = 1000;
const CLEARED_LIMIT = 16;
const MAX_ID_LENGTH = 128;
const EMPTY_STATE = Object.freeze({});
const EMPTY_SET = new Set();

const isId = (value) => {
  const isString = typeof value === 'string';
  return isString && value.length > 0 && value.length <= MAX_ID_LENGTH;
};

const isEnvelope = (delta) => {
  if (typeof delta !== 'object' || delta === null) return false;
  const { id, entity, target, data } = delta;
  const isEntity = typeof entity === 'string' && entity.length <= MAX_ID_LENGTH;
  return isId(id) && isId(target) && isEntity && isDelta(data);
};

const segmentOf = (position) => Math.floor(position / SEGMENT_SIZE);
const segmentFile = (index) => `${index}.json`;

const countSegments = (names) => {
  const files = new Set(names);
  let count = 0;
  while (files.has(segmentFile(count))) count++;
  return count;
};

const createLink = () => ({ source: '', pulled: 0, pushed: 0 });

const toLink = (data) => {
  const link = createLink();
  if (typeof data !== 'object' || data === null) return link;
  const { source, pulled, pushed } = data;
  if (typeof source === 'string') link.source = source;
  if (Number.isSafeInteger(pulled) && pulled > 0) link.pulled = pulled;
  if (Number.isSafeInteger(pushed) && pushed > 0) link.pushed = pushed;
  return link;
};

class Replica extends Emitter {
  #path = '';
  #logPath = '';
  #validate = null;
  #id = '';
  #isOpen = false;
  #opening = null;
  #states = new Map();
  #values = new Map();
  #entities = new Map();
  #log = [];
  #origins = [];
  #links = new Map();
  #cleared = [];
  #clock = 0;
  #dirty = new Set();
  #isMetaDirty = false;
  #saving = Promise.resolve();
  #scheduled = null;
  #linkTimer = null;

  constructor(options = {}) {
    super();
    this.#path = options.path ?? '';
    this.#logPath = `${this.#path}/log`;
    this.#validate = options.validate ?? null;
    this.#id = generateUUID();
    if (this.#path !== '') return;
    this.#isOpen = true;
    this.#opening = Promise.resolve(this);
  }

  get id() {
    return this.#id;
  }

  get position() {
    return this.#log.length;
  }

  get size() {
    return this.#values.size;
  }

  // Ids of logs this replica cleared on purpose, the latest last
  get cleared() {
    return this.#cleared.slice();
  }

  open() {
    this.#opening ??= this.#load();
    return this.#opening;
  }

  async #load() {
    const reading = fsi.read(this.#path, META_FILE);
    const names = await fsi.list(this.#logPath);
    const count = countSegments(names);
    const reads = new Array(count).fill(null);
    for (let i = 0; i < count; i++) {
      reads[i] = fsi.read(this.#logPath, segmentFile(i));
    }
    const raw = await reading;
    const meta = raw === null ? null : jsonParse(raw);
    const isKnown = meta !== null && isId(meta.id);
    if (isKnown) this.#restoreMeta(meta);
    const segments = await Promise.all(reads);
    for (let i = 0; i < segments.length; i++) {
      const isComplete = this.#restoreSegment(segments[i]);
      if (!isComplete) break;
    }
    const isLost = isKnown && meta.position > this.#log.length;
    if (!isKnown || isLost) this.#reset();
    this.#isOpen = true;
    if (this.#isMetaDirty) this.#schedule();
    return this;
  }

  #restoreMeta(meta) {
    this.#id = meta.id;
    const cleared = Array.isArray(meta.cleared) ? meta.cleared : [];
    this.#cleared = cleared.filter(isId).slice(-CLEARED_LIMIT);
    const links = meta.links ?? {};
    const names = Object.keys(links);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const link = toLink(links[name]);
      link.pushed = Math.min(link.pushed, meta.position ?? 0);
      this.#links.set(name, link);
    }
  }

  // Positions are known to other replicas: stored entries are replayed as is
  #restoreSegment(raw) {
    const entries = raw === null ? null : jsonParse(raw);
    if (!Array.isArray(entries)) return false;
    for (let i = 0; i < entries.length; i++) {
      const delta = entries[i];
      if (!isEnvelope(delta)) return false;
      this.#apply(delta);
      this.#log.push(delta);
      this.#origins.push('');
    }
    return entries.length === SEGMENT_SIZE;
  }

  // Lost log tail: new identity makes other replicas pull and push again
  #reset() {
    this.#id = generateUUID();
    this.#links.clear();
    this.#isMetaDirty = true;
  }

  #assertOpen() {
    if (!this.#isOpen) throw new Error('Replica is not open');
  }

  get(target) {
    return this.#values.get(target) ?? null;
  }

  state(target) {
    return this.#states.get(target) ?? null;
  }

  // Record ids of one entity, or all ids; the first delta sets the entity
  keys(entity) {
    if (entity === undefined) return this.#values.keys();
    const targets = this.#entities.get(entity) ?? EMPTY_SET;
    return targets.values();
  }

  since(position = 0, limit = Infinity) {
    const length = this.#log.length;
    const isPosition = Number.isSafeInteger(position) && position > 0;
    const start = isPosition ? Math.min(position, length) : 0;
    const deltas = this.#log.slice(start, start + limit);
    return { deltas, position: start + deltas.length };
  }

  origin(position) {
    const isKnown = position >= 0 && position < this.#origins.length;
    return isKnown ? this.#origins[position] : '';
  }

  assign(entity, target, fields) {
    this.#assertOpen();
    const data = assign(fields, this.#stamp());
    return this.#commit(entity, target, data);
  }

  increment(entity, target, path, amount = 1) {
    this.#assertOpen();
    const state = this.#states.get(target);
    const data = increment(state, path, amount, this.#id);
    return this.#commit(entity, target, data);
  }

  merge(deltas, origin = '') {
    this.#assertOpen();
    if (!Array.isArray(deltas)) return [];
    const fresh = [];
    for (let i = 0; i < deltas.length; i++) {
      const delta = this.#accept(deltas[i]);
      if (delta === null || !this.#apply(delta)) continue;
      this.#log.push(delta);
      this.#origins.push(origin);
      fresh.push(delta);
    }
    if (fresh.length > 0) this.#publish(fresh, origin);
    return fresh;
  }

  // Hybrid clock: own writes are later than every write seen here
  #stamp() {
    const time = Math.max(Date.now(), this.#clock + 1);
    this.#clock = time;
    return { time, replica: this.#id };
  }

  #commit(entity, target, data) {
    const id = generateUUID();
    const fresh = this.merge([{ id, entity, target, data }]);
    return fresh.length > 0 ? fresh[0] : null;
  }

  #accept(delta) {
    if (!isEnvelope(delta)) return null;
    const { id, entity, target, data } = delta;
    const envelope = { id, entity, target, data };
    const isValid = this.#validate === null || this.#validate(envelope);
    return isValid ? envelope : null;
  }

  // Delta that adds nothing to the state is not logged, so it does not loop
  #apply(delta) {
    const { target, data } = delta;
    const state = this.#states.get(target) ?? EMPTY_STATE;
    const next = merge(state, data);
    if (next === state) return false;
    if (!this.#states.has(target)) this.#addEntity(delta);
    this.#states.set(target, next);
    this.#values.set(target, materialize(next));
    const time = latestTime(data);
    if (time > this.#clock) this.#clock = time;
    return true;
  }

  #addEntity({ entity, target }) {
    const targets = this.#entities.get(entity);
    if (targets) targets.add(target);
    else this.#entities.set(entity, new Set([target]));
  }

  #publish(deltas, origin) {
    const position = this.#log.length;
    const first = segmentOf(position - deltas.length);
    const last = segmentOf(position - 1);
    for (let i = first; i <= last; i++) this.#dirty.add(i);
    this.#isMetaDirty = true;
    this.#schedule();
    const event = { deltas, position, origin };
    report(this.emit('log', event), this);
  }

  getLink(name) {
    const link = this.#links.get(name);
    return link ? { ...link } : createLink();
  }

  // Cursors are saved later or with the next log write: a stale cursor
  // only makes a link pull or push deltas again
  setLink(name, link) {
    this.#links.set(name, toLink(link));
    this.#isMetaDirty = true;
    if (this.#path === '' || this.#linkTimer !== null) return;
    const save = () => {
      this.#linkTimer = null;
      this.#schedule();
    };
    this.#linkTimer = setTimeout(save, LINK_SAVE_DELAY_MS);
    if (typeof this.#linkTimer.unref === 'function') this.#linkTimer.unref();
  }

  async clear() {
    if (!this.#isOpen) await this.open();
    this.#states.clear();
    this.#values.clear();
    this.#entities.clear();
    this.#log = [];
    this.#origins = [];
    this.#dirty.clear();
    this.#cleared.push(this.#id);
    if (this.#cleared.length > CLEARED_LIMIT) this.#cleared.shift();
    this.#reset();
    report(this.emit('clear'), this);
    if (this.#path === '') return;
    await this.#enqueue(() => this.#removeFiles());
    await this.save();
  }

  // Saves requested before a write starts share it, the write reads the
  // latest state; writes never overlap
  save() {
    if (this.#path === '') return Promise.resolve();
    if (this.#scheduled) return this.#scheduled;
    const scheduled = this.#enqueue(() => {
      this.#scheduled = null;
      return this.#write();
    });
    this.#scheduled = scheduled;
    return scheduled;
  }

  #enqueue(task) {
    const pending = this.#saving;
    const result = follow(pending, task);
    this.#saving = settle(result);
    return result;
  }

  #schedule() {
    if (this.#path === '' || this.#scheduled) return;
    report(this.save(), this);
  }

  async #write() {
    const segments = Array.from(this.#dirty);
    const isMetaDirty = this.#isMetaDirty;
    this.#dirty.clear();
    this.#isMetaDirty = false;
    try {
      for (let i = 0; i < segments.length; i++) {
        await this.#writeSegment(segments[i]);
      }
      if (isMetaDirty) await fsi.write(this.#path, META_FILE, this.#meta());
    } catch (error) {
      for (let i = 0; i < segments.length; i++) this.#dirty.add(segments[i]);
      if (isMetaDirty) this.#isMetaDirty = true;
      throw error;
    }
  }

  #writeSegment(index) {
    const start = index * SEGMENT_SIZE;
    const entries = this.#log.slice(start, start + SEGMENT_SIZE);
    const data = JSON.stringify(entries);
    return fsi.write(this.#logPath, segmentFile(index), data);
  }

  #meta() {
    const links = Object.fromEntries(this.#links);
    const position = this.#log.length;
    const cleared = this.#cleared;
    const meta = { id: this.#id, position, cleared, links };
    return JSON.stringify(meta);
  }

  // Entries merged while files were removed are written again
  async #removeFiles() {
    const names = await fsi.list(this.#logPath);
    const removeEntry = (name) => fsi.remove(this.#logPath, name);
    await Promise.all(names.map(removeEntry));
    await fsi.remove(this.#path, META_FILE);
    const count = segmentOf(this.#log.length - 1) + 1;
    for (let i = 0; i < count; i++) this.#dirty.add(i);
    this.#isMetaDirty = true;
  }
}

// sync.js

const BATCH_SIZE = 256;
const MAX_PUSH = 1024;

const isEntries = (entries) => {
  if (typeof entries !== 'object' || entries === null) return false;
  const { source, deltas, position } = entries;
  const isPosition = Number.isSafeInteger(position) && position >= 0;
  return typeof source === 'string' && Array.isArray(deltas) && isPosition;
};

class SyncError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class SyncService {
  #replica = null;
  #unit = '';
  #name = '';
  #clients = new Set();
  #listener = null;
  #onClear = null;
  api = null;

  constructor(replica, options = {}) {
    this.#replica = replica;
    this.#unit = options.unit ?? 'sync';
    this.#name = options.name ?? 'downlink';
    this.#listener = (event) => this.#broadcast(event);
    // Empty log with a new source makes subscribers pull and see the clear
    this.#onClear = () => this.#broadcast({ deltas: [], position: 0 });
    replica.on('log', this.#listener);
    replica.on('clear', this.#onClear);
    this.api = {
      subscribe: (args, context) => this.#subscribe(context),
      pull: (args) => this.#pull(args),
      push: (args) => this.#push(args),
    };
  }

  // Metacom server, worker, and peer hosts give the caller as client
  async #subscribe(context) {
    await this.#replica.open();
    const client = context?.client ?? null;
    if (client === null) return false;
    if (this.#clients.has(client)) return true;
    this.#clients.add(client);
    client.on('close', () => this.#clients.delete(client));
    return true;
  }

  // Position from another replica log means nothing here: start from zero
  async #pull(args) {
    await this.#replica.open();
    const replica = this.#replica;
    const source = replica.id;
    const isKnown = args?.source === source;
    const start = isKnown ? args.position : 0;
    const { deltas, position } = replica.since(start, BATCH_SIZE);
    const more = position < replica.position;
    const { cleared } = replica;
    return { source, deltas, position, more, cleared };
  }

  async #push(args) {
    await this.#replica.open();
    const deltas = args?.deltas;
    const isValid = Array.isArray(deltas) && deltas.length <= MAX_PUSH;
    if (!isValid) throw new SyncError('Invalid deltas', 400);
    const replica = this.#replica;
    const fresh = replica.merge(deltas, this.#name);
    const { id: source, position } = replica;
    return { source, position, applied: fresh.length };
  }

  // Frozen data is serialized once by metacom for all subscribers
  #broadcast(event) {
    const name = `${this.#unit}/log`;
    const { deltas, position } = event;
    const source = this.#replica.id;
    const data = Object.freeze({ source, deltas, position });
    for (const client of this.#clients) {
      try {
        client.emit(name, data);
      } catch {
        this.#clients.delete(client);
      }
    }
  }

  close() {
    this.#replica.off('log', this.#listener);
    this.#replica.off('clear', this.#onClear);
    this.#clients.clear();
  }
}

class Uplink extends Emitter {
  #replica = null;
  #metacom = null;
  #unit = '';
  #name = '';
  #link = null;
  #isLoaded = false;
  #isStarted = false;
  #isResending = false;
  #isFollowing = false;
  #queue = Promise.resolve();
  #flushing = null;
  #isFlushRequested = false;
  #onOpen = null;
  #onLog = null;
  #onClear = null;
  #onEntries = null;

  constructor(replica, metacom, options = {}) {
    super();
    this.#replica = replica;
    this.#metacom = metacom;
    this.#unit = options.unit ?? 'sync';
    this.#name = options.name ?? 'uplink';
    this.#isFollowing = options.clear === 'follow';
    this.#link = replica.getLink(this.#name);
    this.#onOpen = () => this.#run(this.sync());
    this.#onLog = (event) => this.#changed(event);
    this.#onClear = () => this.#reset();
    this.#onEntries = (entries) => this.#run(this.#enqueue(entries));
  }

  get link() {
    return { ...this.#link };
  }

  start() {
    if (this.#isStarted) return;
    this.#isStarted = true;
    this.#metacom.on('open', this.#onOpen);
    this.#replica.on('log', this.#onLog);
    this.#replica.on('clear', this.#onClear);
    if (this.#metacom.active) this.#run(this.sync());
  }

  stop() {
    if (!this.#isStarted) return;
    this.#isStarted = false;
    this.#metacom.off('open', this.#onOpen);
    this.#replica.off('log', this.#onLog);
    this.#replica.off('clear', this.#onClear);
    this.#api()?.off('log', this.#onEntries);
  }

  async sync() {
    await this.#replica.open();
    this.#load();
    if (!this.#api()?.pull) await this.#metacom.load(this.#unit);
    const api = this.#api();
    if (!api) throw new Error(`Unit ${this.#unit} is not available`);
    const isListening = api.listeners('log').includes(this.#onEntries);
    if (!isListening) api.on('log', this.#onEntries);
    if (api.subscribe) await api.subscribe();
    await this.pull();
    return this.flush();
  }

  pull() {
    return this.#serialize(() => this.#pullAll());
  }

  flush() {
    if (this.#flushing) {
      this.#isFlushRequested = true;
      return this.#flushing;
    }
    this.#flushing = this.#flushAll();
    return this.#flushing;
  }

  #api() {
    return this.#metacom.api[this.#unit] ?? null;
  }

  #load() {
    if (this.#isLoaded) return;
    this.#isLoaded = true;
    this.#link = this.#replica.getLink(this.#name);
  }

  #reset() {
    this.#link = this.#replica.getLink(this.#name);
    this.#isResending = false;
  }

  #changed(event) {
    if (event.origin === this.#name || !this.#metacom.active) return;
    this.#run(this.flush());
  }

  // Pulls and events change the same cursor: they run one at a time
  #serialize(task) {
    const pending = this.#queue;
    const result = follow(pending, task);
    this.#queue = settle(result);
    return result;
  }

  #enqueue(entries) {
    return this.#serialize(() => this.#receive(entries));
  }

  // Event from another log or after missed entries: pull instead of apply
  async #receive(entries) {
    if (!isEntries(entries)) return;
    const isSameLog = entries.source === this.#link.source;
    if (isSameLog && this.#accept(entries)) return;
    await this.#pullAll();
    this.#run(this.flush());
  }

  async #pullAll() {
    let more = true;
    while (more) {
      const api = this.#api();
      if (!this.#metacom.active || !api?.pull) return false;
      const link = this.#link;
      const { source, pulled: position } = link;
      const reply = await api.pull({ source, position });
      if (link !== this.#link || !isEntries(reply)) return false;
      more = this.#accept(reply) && reply.more === true;
    }
    return true;
  }

  #accept(entries) {
    if (entries.source !== this.#link.source) this.#switch(entries);
    const { deltas, position } = entries;
    const link = this.#link;
    const start = position - deltas.length;
    if (start > link.pulled) return false;
    const offset = link.pulled - start;
    if (offset < deltas.length) this.#merge(deltas.slice(offset));
    if (position > link.pulled) link.pulled = position;
    this.#replica.setLink(this.#name, link);
    return true;
  }

  // Uplink has another log: following its clear empties this replica,
  // otherwise the uplink lost or replaced its log and gets everything
  #switch({ source, cleared }) {
    const previous = this.#link.source;
    const isKnown = previous !== '' && Array.isArray(cleared);
    const isCleared = isKnown && cleared.includes(previous);
    if (isCleared && this.#isFollowing) this.#run(this.#replica.clear());
    else this.#isResending = true;
    const link = this.#link;
    link.source = source;
    link.pulled = 0;
    link.pushed = 0;
  }

  // Deltas from the uplink are not pushed back to it
  #merge(deltas) {
    const replica = this.#replica;
    const link = this.#link;
    const isPushed = link.pushed === replica.position;
    replica.merge(deltas, this.#name);
    if (isPushed) link.pushed = replica.position;
  }

  async #flushAll() {
    try {
      let isDone = false;
      do {
        this.#isFlushRequested = false;
        isDone = await this.#push();
      } while (this.#isFlushRequested);
      return isDone;
    } finally {
      this.#flushing = null;
    }
  }

  async #push() {
    const replica = this.#replica;
    const link = this.#link;
    while (link.pushed < replica.position) {
      const api = this.#api();
      if (!this.#metacom.active || !api?.push) return false;
      const start = link.pushed;
      const end = Math.min(replica.position, start + BATCH_SIZE);
      const deltas = this.#collect(start, end);
      if (deltas.length > 0) await api.push({ deltas });
      if (link !== this.#link) return false;
      if (end > link.pushed) link.pushed = end;
      replica.setLink(this.#name, link);
    }
    this.#isResending = false;
    return true;
  }

  #collect(start, end) {
    const replica = this.#replica;
    const { deltas } = replica.since(start, end - start);
    if (this.#isResending) return deltas;
    const result = [];
    for (let i = 0; i < deltas.length; i++) {
      const isFromUplink = replica.origin(start + i) === this.#name;
      if (!isFromUplink) result.push(deltas[i]);
    }
    return result;
  }

  #run(promise) {
    return report(promise, this);
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
    if (raw === null) await this.#append('0', {});
    else this.tailHash = JSON.parse(raw).tailHash;
    return this;
  }

  async writeChain() {
    const chain = { tailHash: this.tailHash };
    await fsi.write(this.path, BLOCKCHAIN, JSON.stringify(chain));
  }

  addBlock(data) {
    return this.#append(this.tailHash, data);
  }

  async #append(prev, data) {
    const block = { prev, timestamp: Date.now(), data };
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
      if (currentHash !== expectedHash) return false;
      count++;
      if (last && count >= last) break;
      if (block.prev === '0') break;
      currentHash = block.prev;
    }
    return true;
  }
}

// storage.js

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

export {
  emitError,
  follow,
  settle,
  report,
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
  Replica,
  SyncService,
  Uplink,
  Blockchain,
  Storage,
  open,
};
