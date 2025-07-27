'use strict';

const test = require('node:test');
const assert = require('node:assert');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('Keys module', async (t) => {
  await t.test('generateKeys function', async () => {
    const keys = await gs.generateKeys();
    assert.strictEqual(typeof keys.publicKey, 'string');
    assert.strictEqual(typeof keys.privateKey, 'string');
    assert.ok(keys.publicKey.includes('-----BEGIN PUBLIC KEY-----'));
    assert.ok(keys.privateKey.includes('-----BEGIN PRIVATE KEY-----'));
  });

  await t.test('encrypt and decrypt functions', async () => {
    const keys = await gs.generateKeys();
    const testData = { message: 'Hello, World!', number: 42 };

    const encrypted = gs.encrypt(testData, keys.publicKey);
    assert.strictEqual(typeof encrypted, 'string');
    assert.notStrictEqual(encrypted, JSON.stringify(testData));

    const decrypted = gs.decrypt(encrypted, keys.privateKey);
    assert.deepStrictEqual(decrypted, testData);
  });

  await t.test('loadKeys function', async () => {
    const tempDir = await createTempDir();
    try {
      const keys1 = await gs.loadKeys(tempDir);
      assert.strictEqual(typeof keys1.publicKey, 'string');
      assert.strictEqual(typeof keys1.privateKey, 'string');

      const keys2 = await gs.loadKeys(tempDir);
      assert.strictEqual(keys2.publicKey, keys1.publicKey);
      assert.strictEqual(keys2.privateKey, keys1.privateKey);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
