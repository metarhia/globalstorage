'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');
const globalStorage = require('..');
const { SmartContract, DataReader, Blockchain } = globalStorage;
const { createTemp, cleanupTemp } = require('./utils/temp.js');

test('Contract module', async (t) => {
  await t.test('DataReader get reads storage', async () => {
    const tempDir = await createTemp();
    try {
      const storage = await globalStorage.open({ path: tempDir });
      const reader = new DataReader(storage);

      assert.strictEqual(await reader.get('missing'), null);

      await storage.saveData('doc-1', { x: 1 });
      assert.deepStrictEqual(await reader.get('doc-1'), { x: 1 });
    } finally {
      await cleanupTemp(tempDir);
    }
  });

  await t.test('SmartContract execute method', async () => {
    const tempDir = await createTemp();
    try {
      const storage = await globalStorage.open({ path: tempDir });
      const chainPath = path.join(tempDir, 'blockchain');
      const blockchain = await new globalStorage.Blockchain(chainPath);
      const context = { storage, chain: blockchain };

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
    } finally {
      await cleanupTemp(tempDir);
    }
  });

  await t.test('SmartContract execute method with error', async () => {
    const tempDir = await createTemp();
    try {
      const storage = await globalStorage.open({ path: tempDir });
      const chainPath = path.join(tempDir, 'blockchain');
      const blockchain = await new globalStorage.Blockchain(chainPath);
      const context = { storage, chain: blockchain };

      const testProc = async () => {
        throw new Error('Test error');
      };

      const contract = new SmartContract('test-contract', testProc, context);
      const args = { id: 'test-1', input: 42 };

      await assert.rejects(
        async () => await contract.execute(args),
        /Test error/,
      );

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
    } finally {
      await cleanupTemp(tempDir);
    }
  });

  await t.test('SmartContract save and load static methods', async () => {
    const tempDir = await createTemp();
    try {
      const storage = await globalStorage.open({ path: tempDir });
      const chainPath = path.join(tempDir, 'blockchain');
      const blockchain = await new globalStorage.Blockchain(chainPath);
      const context = { storage, chain: blockchain };

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
    } finally {
      await cleanupTemp(tempDir);
    }
  });

  await t.test('SmartContract.load rejects non-contract block', async () => {
    const tempDir = await createTemp();
    try {
      const storage = await globalStorage.open({ path: tempDir });
      const chainPath = path.join(tempDir, 'extra-chain');
      const blockchain = await new Blockchain(chainPath);
      const context = { storage, chain: blockchain };

      const plainHash = await blockchain.addBlock({ kind: 'not-a-contract' });

      await assert.rejects(
        () => SmartContract.load(plainHash, context),
        /Not a smart contract block/,
      );
    } finally {
      await cleanupTemp(tempDir);
    }
  });
});
