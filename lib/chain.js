'use strict';

const fsi = require('./fsi.js');
const { calculateHash } = require('./crypto.js');

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

module.exports = { Blockchain };
