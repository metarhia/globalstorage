'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { fileExists } = require('metautil');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('Chain module', async (t) => {
  await t.test('calculateHash function', () => {
    const data = { test: 'data' };
    const hash1 = gs.calculateHash(data);
    const hash2 = gs.calculateHash(data);

    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(hash1, hash2);
  });

  await t.test('Blockchain constructor and initialization', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);

      assert.strictEqual(blockchain.path, tempDir);
      assert.strictEqual(typeof blockchain.tailHash, 'string');
      assert.strictEqual(blockchain.nextId, 1);

      const chainFile = path.join(tempDir, '.blockchain.json');
      assert.strictEqual(await fileExists(chainFile), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Blockchain addBlock and readBlock', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const testData = { message: 'Test block data' };

      const result = await blockchain.addBlock(testData);
      assert.strictEqual(typeof result.id, 'number');
      assert.strictEqual(typeof result.hash, 'string');
      assert.strictEqual(result.id, 1);

      const block = await blockchain.readBlock(result.hash);
      assert.strictEqual(block.id, '1');
      assert.notStrictEqual(block.prev, '0');
      assert.strictEqual(typeof block.timestamp, 'number');
      assert.deepStrictEqual(block.data, testData);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Blockchain chain validation', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);

      await blockchain.addBlock({ data: 'block1' });
      await blockchain.addBlock({ data: 'block2' });
      await blockchain.addBlock({ data: 'block3' });

      const isValid = await blockchain.isValid();
      assert.strictEqual(isValid, true);

      const isValidLast = await blockchain.isValid({ last: 2 });
      assert.strictEqual(isValidLast, true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Blockchain writeBlock', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const timestamp = Date.now();
      const data = { test: 'data' };
      const testBlock = { id: '1', prev: '0', timestamp, data };

      const hash = await blockchain.writeBlock(testBlock);
      assert.strictEqual(typeof hash, 'string');

      const blockFile = path.join(tempDir, `${hash}.json`);
      assert.strictEqual(await fileExists(blockFile), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
