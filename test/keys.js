'use strict';

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('../lib/crypto-node.js');
const { useTemp } = require('./utils/temp.js');
const { runCryptoKeysTests } = require('./suites/crypto-keys.js');

test('Keys module', async (t) => {
  await runCryptoKeysTests(t, assert, crypto, {
    getKeysBase: useTemp,
  });
});
