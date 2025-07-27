'use strict';

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
    const { id, hash } = await chain.addBlock(block);
    return { id, hash };
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

module.exports = { DataReader, SmartContract };
