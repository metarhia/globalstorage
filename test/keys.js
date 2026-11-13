'use strict';

const test = require('node:test');
const assert = require('node:assert');
const cryptoMod = require('../lib/crypto.js');
const { useTemp } = require('./utils/temp.js');
const { runCryptoKeysTests } = require('./suites/crypto-keys.js');

test('Keys module', async (t) => {
  await runCryptoKeysTests(t, assert, cryptoMod, {
    getKeysBase: useTemp,
  });
});
