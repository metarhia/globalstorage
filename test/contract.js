'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');
const globalStorage = require('..');
const { SmartContract, DataReader, Blockchain } = globalStorage;
const { useTemp } = require('./utils/temp.js');

test('Contract module', async (t) => {
  await t.test('DataReader get reads storage', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });
    const reader = new DataReader(storage);

    assert.strictEqual(await reader.get('missing'), null);

    await storage.saveData('doc-1', { x: 1 });
    assert.deepStrictEqual(await reader.get('doc-1'), { x: 1 });
  });

  await t.test('SmartContract execute method', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });
    const context = { storage };

    const testProc = async (reader, args) => ({
      processed: args.input,
      doubled: args.input * 2,
    });

    const contract = new SmartContract('test-contract', testProc, context);
    assert.strictEqual(contract.name, 'test-contract');
    assert.ok(contract instanceof SmartContract);

    const args = { id: 'test-1', input: 42 };

    const result = await contract.execute(args);
    assert.deepStrictEqual(result, { processed: 42, doubled: 84 });

    const savedData = await storage.loadData('test-1');
    assert.deepStrictEqual(savedData, { processed: 42, doubled: 84 });
  });

  await t.test('SmartContract execute method with error', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });
    const blockchain = storage.chain;
    const context = { storage };

    const testProc = async () => {
      throw new Error('Test error');
    };

    const contract = new SmartContract('test-contract', testProc, context);
    const args = { id: 'test-1', input: 42 };

    await assert.rejects(() => contract.execute(args), /Test error/);

    const blocks = [];
    let currentHash = blockchain.tailHash;
    while (currentHash && currentHash !== '0') {
      const block = await blockchain.readBlock(currentHash);
      blocks.push(block);
      currentHash = block.prev;
    }

    const errorBlock = blocks.find(
      (block) =>
        block.data.contract === 'test-contract' &&
        block.data.error === 'Test error',
    );
    assert.ok(errorBlock);
  });

  await t.test('SmartContract save and load static methods', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });
    const blockchain = storage.chain;
    const context = { storage };

    const testProc = async (reader, args) => ({
      result: args.input * 2,
    });

    const hash = await globalStorage.SmartContract.save(
      'test-contract',
      blockchain,
      testProc,
    );
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64);

    const loadedContract = await SmartContract.load(hash, context);
    assert.ok(loadedContract instanceof SmartContract);
    assert.strictEqual(loadedContract.name, 'test-contract');

    const result = await loadedContract.execute({
      id: 'test-1',
      input: 21,
    });
    assert.deepStrictEqual(result, { result: 42 });
  });

  await t.test('SmartContract.load rejects non-contract block', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });
    const chainPath = path.join(tempDir, 'extra-chain');
    const blockchain = await new Blockchain(chainPath);
    const context = { storage, chain: blockchain };

    const plainHash = await blockchain.addBlock({ kind: 'not-a-contract' });

    await assert.rejects(
      () => SmartContract.load(plainHash, context),
      /Not a smart contract block/,
    );
  });
});
