'use strict';

const metasync = require('metasync');

const subtests = [
  'memory', 'mongodb',
  'transaction', 'dataset.transaction', 'cursor.transaction',
].map(name => require('./' + name));

metasync(subtests)(() => {
  process.exit(0);
});
