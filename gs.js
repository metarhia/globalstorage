'use strict';

const chain = require('./lib/chain.js');
const contract = require('./lib/contract.js');
const keys = require('./lib/keys.js');
const storage = require('./lib/storage.js');

module.exports = { ...chain, ...contract, ...keys, ...storage };
