const PUBLIC_KEY_HEADER = '-----BEGIN PUBLIC KEY-----';
const PUBLIC_KEY_FOOTER = '-----END PUBLIC KEY-----';
const PRIVATE_KEY_HEADER = '-----BEGIN PRIVATE KEY-----';
const PRIVATE_KEY_FOOTER = '-----END PRIVATE KEY-----';

const toBase64UrlSafe = (buffer) => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const cleanPemKey = (pemKey, header, footer) => {
  const s = pemKey.replace(header, '').replace(footer, '');
  return s.replaceAll(' ', '');
};

const calculateHash = async (data) => {
  const block = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(block);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const toHex = (b) => b.toString(16).padStart(2, '0');
  const hashHex = hashArray.map(toHex).join('');
  return hashHex;
};

const generateKeys = async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const publicKeyBuffer = await crypto.subtle.exportKey(
    'spki',
    keyPair.publicKey,
  );
  const privateKeyBuffer = await crypto.subtle.exportKey(
    'pkcs8',
    keyPair.privateKey,
  );

  const publicKey = toBase64UrlSafe(publicKeyBuffer);
  const privateKey = toBase64UrlSafe(privateKeyBuffer);

  return {
    publicKey: `${PUBLIC_KEY_HEADER}\n${publicKey}\n${PUBLIC_KEY_FOOTER}`,
    privateKey: `${PRIVATE_KEY_HEADER}\n${privateKey}\n${PRIVATE_KEY_FOOTER}`,
  };
};

const importPublicKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PUBLIC_KEY_HEADER, PUBLIC_KEY_FOOTER);
  const bytes = base64ToBytes(base64);

  return await crypto.subtle.importKey(
    'spki',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt'],
  );
};

const importPrivateKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER);
  const bytes = base64ToBytes(base64);

  return await crypto.subtle.importKey(
    'pkcs8',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt'],
  );
};

const encrypt = async (data, publicKey) => {
  const key = await importPublicKey(publicKey);
  const dataString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dataString);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    key,
    dataBuffer,
  );

  return toBase64UrlSafe(encryptedBuffer);
};

const decrypt = async (data, privateKey) => {
  const key = await importPrivateKey(privateKey);
  const bytes = base64ToBytes(data);
  const name = 'RSA-OAEP';
  const buffer = await crypto.subtle.decrypt({ name }, key, bytes);
  const decoder = new TextDecoder();
  const decrypted = decoder.decode(buffer);
  return JSON.parse(decrypted);
};

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

const loadKeys = async (basePath = 'keys') => {
  let publicKey, privateKey;
  try {
    const root = await navigator.storage.getDirectory();
    const keysDir = await root.getDirectoryHandle(basePath, { create: true });

    try {
      const publicFile = await keysDir.getFileHandle('public.pem');
      const privateFile = await keysDir.getFileHandle('private.pem');

      const publicKeyFile = await publicFile.getFile();
      const privateKeyFile = await privateFile.getFile();

      publicKey = await publicKeyFile.text();
      privateKey = await privateKeyFile.text();
    } catch {
      const keys = await generateKeys();

      const publicFileHandle = await keysDir.getFileHandle('public.pem', {
        create: true,
      });
      const privateFileHandle = await keysDir.getFileHandle('private.pem', {
        create: true,
      });

      const publicWritable = await publicFileHandle.createWritable();
      const privateWritable = await privateFileHandle.createWritable();

      await publicWritable.write(keys.publicKey);
      await privateWritable.write(keys.privateKey);

      await publicWritable.close();
      await privateWritable.close();

      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
    }
  } catch {
    const keys = await generateKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  }

  return { publicKey, privateKey };
};

// Full-text search: trigram utilities

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\s+/g, ' ')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

function* extractTrigrams(text) {
  const normalized = normalize(text);
  for (let i = 0; i <= normalized.length - 3; i++) {
    yield normalized.slice(i, i + 3);
  }
}

function* extractStrings(data) {
  if (typeof data === 'string') {
    yield data;
  } else if (data !== null && typeof data === 'object') {
    for (const key in data) yield* extractStrings(data[key]);
  }
}

const extractRecordTrigrams = (data) => {
  const counts = new Map();
  for (const str of extractStrings(data)) {
    for (const trigram of extractTrigrams(str)) {
      counts.set(trigram, (counts.get(trigram) || 0) + 1);
    }
  }
  return counts;
};

// Full-text search: OPFS repository

const FTS_INDEX_FILE = 'fts-index.json';

class SearchRepositoryOPFS {
  #dirHandle;

  constructor() {
    return this.#init();
  }

  async #getFileHandle(options = {}) {
    return await this.#dirHandle.getFileHandle(FTS_INDEX_FILE, options);
  }

  async #init() {
    const root = await navigator.storage.getDirectory();
    this.#dirHandle = await root.getDirectoryHandle('fts', {
      create: true,
    });
    return this;
  }

  async load() {
    try {
      const fileHandle = await this.#getFileHandle();
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (cause) {
      if (cause.name !== 'NotFoundError') {
        throw new Error('SearchRepositoryOPFS::load', { cause });
      }
      return null;
    }
  }

  async save(data) {
    const fileHandle = await this.#getFileHandle({ create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }
}

// Full-text search: SearchIndex

class SearchIndex {
  #storage;
  #chain;
  #index;
  #docStats;
  #docCount;
  #repository;

  constructor(storage, chain, repository) {
    this.#storage = storage;
    this.#chain = chain;
    this.#index = new Map();
    this.#docStats = new Map();
    this.#docCount = 0;
    this.#repository = repository;
    return this.#init();
  }

  async #init() {
    await this.#load();
    return this;
  }

  async #load() {
    const raw = await this.#repository.load();
    if (!raw) return;
    const { data, block } = JSON.parse(raw);
    const hash = await calculateHash(data);
    const blockRecord = await this.#chain.readBlock(block);
    const valid =
      blockRecord.data.hash === hash && blockRecord.data.type === 'fts-index';
    if (!valid) throw new Error('FTS index integrity check failed');
    this.#deserialize(data);
  }

  #deserialize(data) {
    this.#docCount = data.docCount;
    this.#index = new Map(
      Object.entries(data.index).map(([trigram, ids]) => [
        trigram,
        new Set(ids),
      ]),
    );
    this.#docStats = new Map(
      Object.entries(data.docStats).map(([id, stats]) => [
        id,
        {
          counts: new Map(Object.entries(stats.counts)),
          total: stats.total,
        },
      ]),
    );
  }

  #serialize() {
    return {
      docCount: this.#docCount,
      index: Object.fromEntries(
        Array.from(this.#index, ([trigram, ids]) => [trigram, [...ids]]),
      ),
      docStats: Object.fromEntries(
        Array.from(this.#docStats, ([id, { counts, total }]) => [
          id,
          { counts: Object.fromEntries(counts), total },
        ]),
      ),
    };
  }

  async #save() {
    const data = this.#serialize();
    const hash = await calculateHash(data);
    const blockHash = await this.#chain.addBlock({
      type: 'fts-index',
      hash,
    });
    const entry = { data, timestamp: Date.now(), block: blockHash };
    await this.#repository.save(JSON.stringify(entry));
  }

  #removeFromIndex(id) {
    const stats = this.#docStats.get(id);
    if (!stats) return;
    for (const trigram of stats.counts.keys()) {
      const ids = this.#index.get(trigram);
      if (!ids) continue;
      ids.delete(id);
      if (ids.size === 0) this.#index.delete(trigram);
    }
    this.#docStats.delete(id);
    this.#docCount--;
  }

  #indexRecord(id, data) {
    this.#removeFromIndex(id);
    const counts = extractRecordTrigrams(data);
    if (counts.size === 0) return;
    let total = 0;
    for (const [trigram, count] of counts) {
      total += count;
      let ids = this.#index.get(trigram);
      if (!ids) {
        ids = new Set();
        this.#index.set(trigram, ids);
      }
      ids.add(id);
    }
    this.#docStats.set(id, { counts, total });
    this.#docCount++;
  }

  async index(id, data) {
    this.#indexRecord(id, data);
    await this.#save();
  }

  async remove(id) {
    if (!this.#docStats.has(id)) return;
    this.#removeFromIndex(id);
    await this.#save();
  }

  search(query, limit = 10) {
    const queryTrigrams = new Set(extractTrigrams(query));
    if (queryTrigrams.size === 0 || this.#docCount === 0) return [];
    const scores = new Map();
    for (const trigram of queryTrigrams) {
      const matchingIds = this.#index.get(trigram);
      if (!matchingIds) continue;
      const idf = Math.log(this.#docCount / matchingIds.size);
      for (const id of matchingIds) {
        const { counts, total } = this.#docStats.get(id);
        const tf = (counts.get(trigram) || 0) / total;
        scores.set(id, (scores.get(id) || 0) + tf * idf);
      }
    }
    return Array.from(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => ({ id, score }));
  }

  async rebuild() {
    this.#index.clear();
    this.#docStats.clear();
    this.#docCount = 0;
    const ids = await this.#storage.listIds();
    for (const id of ids) {
      const data = await this.#storage.get(id);
      if (data) this.#indexRecord(id, data);
    }
    await this.#save();
  }
}

export {
  generateKeys,
  encrypt,
  decrypt,
  loadKeys,
  calculateHash,
  deserializeFunction,
  extractTrigrams,
  extractStrings,
  extractRecordTrigrams,
  SearchRepositoryOPFS,
  SearchIndex,
};
