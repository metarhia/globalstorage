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

  if (typeof globalThis.btoa !== 'function') {
    globalThis.btoa = (s) => Buffer.from(s, 'latin1').toString('base64');
  }
  if (typeof globalThis.atob !== 'function') {
    globalThis.atob = (s) => Buffer.from(s, 'base64').toString('latin1');
  }

  const cryptoBrowser = require('../lib/crypto-browser.js');

  await runCryptoKeysTests(t, assert, cryptoBrowser, {
    getKeysBase: async () =>
      `keys-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  });
});
