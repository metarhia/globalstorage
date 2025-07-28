'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { fileExists, ensureDirectory } = require('metautil');

const { encrypt, decrypt } = require('./keys.js');
const { calculateHash } = require('./chain.js');

class Storage {
  #basePath;
  #keys;
  #chain;

  constructor(basePath, blockchain, keys = {}) {
    this.#basePath = basePath;
    this.#chain = blockchain;
    this.#keys = keys;
    return this.#init();
  }

  async #init() {
    await ensureDirectory(this.#basePath);
    return this;
  }

  async saveData(id, data, options = {}) {
    const { encrypted = false } = options;
    const record = encrypted ? encrypt(data, this.#keys.publicKey) : data;
    const timestamp = Date.now();

    const hash = calculateHash(record);
    const block = await this.#chain.addBlock({ id, hash });

    const entry = { data: record, encrypted, timestamp, block: block.hash };
    const filePath = path.join(this.#basePath, `${id}.json`);
    const raw = JSON.stringify(entry);
    await fs.writeFile(filePath, raw);
  }

  async loadData(id) {
    const filePath = path.join(this.#basePath, `${id}.json`);
    const exists = await fileExists(filePath);
    if (!exists) return null;
    const raw = await fs.readFile(filePath, { encoding: 'utf8' });
    const { data, encrypted, block } = JSON.parse(raw);
    const isValid = await this.validate(id, data, block);
    if (!isValid) throw new Error(`Storage record ${id} is invalid`);
    return encrypted ? decrypt(data, this.#keys.privateKey) : data;
  }

  async validate(id, data, blockHash) {
    try {
      const block = await this.#chain.readBlock(blockHash);
      const expectedHash = calculateHash(data);
      if (!block) return false;
      return block.data.hash === expectedHash && block.data.id === id;
    } catch {
      return false;
    }
  }
}

module.exports = { Storage };
