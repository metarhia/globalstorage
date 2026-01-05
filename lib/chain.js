'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fileExists } = require('metautil');

const BLOCKCHAIN = '.blockchain.json';

const calculateHash = (data) => {
  const block = JSON.stringify(data);
  return crypto.createHash('sha256').update(block).digest('hex');
};

class Blockchain {
  constructor(basePath) {
    this.path = basePath;
    this.tailHash = null;
    return this.#init();
  }

  async #init() {
    await fs.mkdir(this.path, { recursive: true });
    const file = path.join(this.path, BLOCKCHAIN);
    const exists = await fileExists(file);
    if (!exists) {
      const block = { prev: '0', timestamp: Date.now(), data: {} };
      this.tailHash = await this.writeBlock(block);
      await this.writeChain();
    } else {
      const raw = await fs.readFile(file);
      const chain = JSON.parse(raw);
      this.tailHash = chain.tailHash;
    }
    return this;
  }

  async writeChain() {
    const file = path.join(this.path, BLOCKCHAIN);
    const chain = { tailHash: this.tailHash };
    await fs.writeFile(file, JSON.stringify(chain));
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
    const hash = calculateHash(block);
    const file = path.join(this.path, `${hash}.json`);
    await fs.writeFile(file, JSON.stringify(block));
    return hash;
  }

  async readBlock(hash) {
    const file = path.join(this.path, `${hash}.json`);
    const exists = await fileExists(file);
    if (!exists) throw Error(`File not found ${file}`);
    const data = await fs.readFile(file);
    return JSON.parse(data);
  }

  async validate({ last, from } = {}) {
    let currentHash = from || this.tailHash;
    if (!currentHash) return false;
    let count = 0;
    while (currentHash) {
      const block = await this.readBlock(currentHash);
      const expectedHash = calculateHash(block);
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

module.exports = { Blockchain, calculateHash };
