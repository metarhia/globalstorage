'use strict';

const assert = require('node:assert');
const path = require('node:path');

const runFsiTests = async (t, fsi, options = {}) => {
  const { getRoot, afterEach } = options;
  const joinPath = options.joinPath ?? ((r, ...p) => path.join(r, ...p));

  const finish = async (dir) => {
    if (afterEach) await afterEach(dir);
  };

  await t.test('write read exists and remove', async () => {
    const dir = await getRoot();
    try {
      assert.strictEqual(await fsi.exists(dir, 'a.txt'), false);
      await fsi.write(dir, 'a.txt', 'hello');
      assert.strictEqual(await fsi.exists(dir, 'a.txt'), true);
      assert.strictEqual(await fsi.read(dir, 'a.txt'), 'hello');
      await fsi.remove(dir, 'a.txt');
      assert.strictEqual(await fsi.exists(dir, 'a.txt'), false);
    } finally {
      await finish(dir);
    }
  });

  await t.test('write creates nested directories', async () => {
    const root = await getRoot();
    try {
      const nested = joinPath(root, 'x', 'y');
      await fsi.write(nested, 'f.json', '{}');
      assert.strictEqual(await fsi.exists(nested, 'f.json'), true);
      assert.strictEqual(await fsi.read(nested, 'f.json'), '{}');
    } finally {
      await finish(root);
    }
  });

  await t.test('remove when missing does not throw', async () => {
    const dir = await getRoot();
    try {
      await fsi.remove(dir, 'nope.txt');
      assert.strictEqual(await fsi.exists(dir, 'nope.txt'), false);
    } finally {
      await finish(dir);
    }
  });

  await t.test('read when missing rejects', async () => {
    const dir = await getRoot();
    try {
      await assert.rejects(
        () => fsi.read(dir, 'missing.txt'),
        (err) => {
          const isEnoent = err?.code === 'ENOENT';
          const isNotFound = err?.name === 'NotFoundError';
          const matches = isEnoent || isNotFound;
          return Boolean(err && matches);
        },
      );
    } finally {
      await finish(dir);
    }
  });
};

module.exports = { runFsiTests };
