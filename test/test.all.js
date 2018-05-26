'use strict';

const metasync = require('metasync');

const subtests = [
  'memory', 'mongodb', 'indexeddb.provider',
].map(name => require('./' + name));

metasync(subtests)(() => {
  process.exit(0);
});
