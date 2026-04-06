'use strict';

const test = require('node:test');
const assert = require('node:assert');
const cryptoMod = require('../lib/crypto.js');
const { createTemp, cleanupTemp } = require('./utils/temp.js');
const { runCryptoKeysTests } = require('./suites/crypto-keys.js');

test('Keys module', async (t) => {
  await runCryptoKeysTests(t, assert, cryptoMod, {
    getKeysBase: async (t2) => {
      const tempDir = await createTemp();
      t2.after(() => cleanupTemp(tempDir));
      return tempDir;
    },
  });
});
