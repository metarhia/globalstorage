'use strict';

const metasync = require('metasync');

const subtests = ['memory', 'mongodb'].map(name => require('./' + name));

metasync(subtests)(() => {
  process.exit(0);
});
