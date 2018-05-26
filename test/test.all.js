'use strict';

const metasync = require('metasync');

const subtests = [
  'memory', 'mongodb', 'localstorage.provider',
].map(name => require('./' + name));

metasync(subtests)(() => {
  process.exit(0);
});
