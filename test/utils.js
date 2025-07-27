'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('Utils module', async (t) => {
  await t.test('toBool array', () => {
    assert.strictEqual(gs.toBool.length, 2);
    assert.strictEqual(typeof gs.toBool[0], 'function');
    assert.strictEqual(typeof gs.toBool[1], 'function');
    assert.strictEqual(gs.toBool[0](), true);
    assert.strictEqual(gs.toBool[1](), false);
  });

  await t.test('exists function', async () => {
    const tempDir = await createTempDir();
    try {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test');

      assert.strictEqual(await gs.exists(testFile), true);
      assert.strictEqual(
        await gs.exists(path.join(tempDir, 'nonexistent.txt')),
        false,
      );
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('ensureDirectory function', async () => {
    const tempDir = await createTempDir();
    try {
      const newDir = path.join(tempDir, 'newdir');

      const result1 = await gs.ensureDirectory(newDir);
      assert.strictEqual(result1, true);
      assert.strictEqual(await gs.exists(newDir), true);

      const result2 = await gs.ensureDirectory(newDir);
      assert.strictEqual(result2, true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
