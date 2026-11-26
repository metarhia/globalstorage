'use strict';

const { fsi } = require('./fsi-node.js');
const { calculateHash } = require('./crypto-node.js');

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

module.exports = { Blockchain };
