'use strict';

const deserializeFunction = (source) => new Function(`return (${source});`)();

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

module.exports = { DataReader, SmartContract };
