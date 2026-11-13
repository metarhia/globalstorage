'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { fileExists } = require('metautil');
const globalStorage = require('..');
const { useTemp } = require('./utils/temp.js');

test('Chain module', async (t) => {
  await t.test('calculateHash function', () => {
    const data = { test: 'data' };
    const hash1 = globalStorage.calculateHash(data);
    const hash2 = globalStorage.calculateHash(data);

    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(hash1, hash2);
  });

  await t.test('Blockchain constructor and initialization', async (t) => {
    const tempDir = await useTemp(t);
    const blockchain = await new globalStorage.Blockchain(tempDir);

    assert.strictEqual(blockchain.path, tempDir);
    assert.strictEqual(typeof blockchain.tailHash, 'string');

    const chainFile = path.join(tempDir, '.blockchain.json');
    assert.strictEqual(await fileExists(chainFile), true);
  });

  await t.test('Blockchain addBlock and readBlock', async (t) => {
    const tempDir = await useTemp(t);
    const blockchain = await new globalStorage.Blockchain(tempDir);
    const testData = { message: 'Test block data' };

    const hash = await blockchain.addBlock(testData);
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64);

    const block = await blockchain.readBlock(hash);
    assert.notStrictEqual(block.prev, '0');
    assert.strictEqual(typeof block.timestamp, 'number');
    assert.deepStrictEqual(block.data, testData);
  });

  await t.test('Blockchain chain validation', async (t) => {
    const tempDir = await useTemp(t);
    const blockchain = await new globalStorage.Blockchain(tempDir);

    await blockchain.addBlock({ data: 'block1' });
    await blockchain.addBlock({ data: 'block2' });
    await blockchain.addBlock({ data: 'block3' });

    const isValid = await blockchain.validate();
    assert.strictEqual(isValid, true);

    const isValidLast = await blockchain.validate({ last: 2 });
    assert.strictEqual(isValidLast, true);
  });

  await t.test('Blockchain writeBlock', async (t) => {
    const tempDir = await useTemp(t);
    const blockchain = await new globalStorage.Blockchain(tempDir);
    const timestamp = Date.now();
    const data = { test: 'data' };
    const testBlock = { prev: '0', timestamp, data };

    const hash = await blockchain.writeBlock(testBlock);
    assert.strictEqual(typeof hash, 'string');

    const blockFile = path.join(tempDir, `${hash}.json`);
    assert.strictEqual(await fileExists(blockFile), true);
  });
});
