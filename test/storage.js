'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const { directoryExists } = require('metautil');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('Storage module', async (t) => {
  await t.test('Storage constructor and initialization', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);

      assert.ok(storage instanceof gs.Storage);
      assert.strictEqual(await directoryExists(tempDir), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage saveData and loadData without encryption', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);

      const testData = { message: 'Hello, Storage!', number: 123 };
      await storage.saveData('test-1', testData);

      const loadedData = await storage.loadData('test-1');
      assert.deepStrictEqual(loadedData, testData);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage saveData and loadData with encryption', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const keys = await gs.loadKeys(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain, keys);

      const testData = { secret: 'encrypted data', value: 456 };
      await storage.saveData('test-2', testData, { encrypted: true });

      const loadedData = await storage.loadData('test-2');
      assert.deepStrictEqual(loadedData, testData);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage loadData with non-existent data', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);

      const result = await storage.loadData('nonexistent');
      assert.strictEqual(result, null);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage validate method', async () => {
    const tempDir = await createTempDir();
    try {
      const blockchain = await new gs.Blockchain(tempDir);
      const storage = await new gs.Storage(tempDir, blockchain);

      const testData = { message: 'Test validation' };
      await storage.saveData('test-3', testData);

      const filePath = path.join(tempDir, 'test-3.json');
      const raw = await fs.readFile(filePath, { encoding: 'utf8' });
      const entry = JSON.parse(raw);

      const isValid = await storage.validate('test-3', entry.data, entry.block);
      assert.strictEqual(isValid, true);

      const isInvalid = await storage.validate(
        'test-3',
        { modified: 'data' },
        entry.block,
      );
      assert.strictEqual(isInvalid, false);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
