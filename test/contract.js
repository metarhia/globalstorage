'use strict';

const test = require('node:test');
const assert = require('node:assert');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('Contract module', async (t) => {
  await t.test('DataReader constructor and get method', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);
      const reader = new gs.DataReader(storage);

      assert.ok(reader instanceof gs.DataReader);

      const result = await reader.get('nonexistent');
      assert.strictEqual(result, null);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('SmartContract constructor and properties', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);
      const context = { storage, chain: blockchain };

      const testProc = async (reader, args) => ({
        processed: args.input,
      });

      const contract = new gs.SmartContract('test-contract', testProc, context);

      assert.strictEqual(contract.name, 'test-contract');
      assert.ok(contract instanceof gs.SmartContract);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('SmartContract execute method', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);
      const context = { storage, chain: blockchain };

      const testProc = async (reader, args) => ({
        processed: args.input,
        doubled: args.input * 2,
      });

      const contract = new gs.SmartContract('test-contract', testProc, context);
      const args = { id: 'test-1', input: 42 };

      const result = await contract.execute(args);
      assert.deepStrictEqual(result, { processed: 42, doubled: 84 });

      const savedData = await storage.loadData('test-1');
      assert.deepStrictEqual(savedData, { processed: 42, doubled: 84 });
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('SmartContract execute method with error', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);
      const context = { storage, chain: blockchain };

      const testProc = async () => {
        throw new Error('Test error');
      };

      const contract = new gs.SmartContract('test-contract', testProc, context);
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
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('SmartContract save and load static methods', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);
      const context = { storage, chain: blockchain };

      const testProc = async (reader, args) => ({
        result: args.input * 2,
      });

      const saveResult = await gs.SmartContract.save(
        'test-contract',
        blockchain,
        testProc,
      );
      assert.strictEqual(typeof saveResult.id, 'number');
      assert.strictEqual(typeof saveResult.hash, 'string');

      const loadedContract = await gs.SmartContract.load(
        saveResult.hash,
        context,
      );
      assert.ok(loadedContract instanceof gs.SmartContract);
      assert.strictEqual(loadedContract.name, 'test-contract');

      const result = await loadedContract.execute({
        id: 'test-1',
        input: 21,
      });
      assert.deepStrictEqual(result, { result: 42 });
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
