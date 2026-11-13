'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { webcrypto } = require('node:crypto');
const { installMockOpfs } = require('./utils/mock-opfs.js');
const { runCryptoKeysTests } = require('./suites/crypto-keys.js');

test('crypto-browser module', async (t) => {
  const opfs = installMockOpfs();
  t.after(() => opfs.uninstall());

  const prevCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
    enumerable: true,
  });
  t.after(() => {
    if (prevCrypto) Object.defineProperty(globalThis, 'crypto', prevCrypto);
    else delete globalThis.crypto;
  });

  const cryptoBrowser = require('../lib/crypto-browser.js');

  await t.test('interoperates with node crypto', async () => {
    const nodeCrypto = require('../lib/crypto.js');
    const data = { message: 'cross-runtime', value: 1 };
    const nodeHash = nodeCrypto.calculateHash(data);
    assert.strictEqual(await cryptoBrowser.calculateHash(data), nodeHash);
    const nodeKeys = await nodeCrypto.generateKeys();
    const browserKeys = await cryptoBrowser.generateKeys();
    for (const { publicKey, privateKey } of [nodeKeys, browserKeys]) {
      const fromNode = nodeCrypto.encrypt(data, publicKey);
      const fromBrowser = await cryptoBrowser.encrypt(data, publicKey);
      const decryptedInBrowser = await cryptoBrowser.decrypt(
        fromNode,
        privateKey,
      );
      assert.deepStrictEqual(decryptedInBrowser, data);
      assert.deepStrictEqual(nodeCrypto.decrypt(fromBrowser, privateKey), data);
    }
  });

  await runCryptoKeysTests(t, assert, cryptoBrowser, {
    getKeysBase: async () =>
      `keys-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  });
});
