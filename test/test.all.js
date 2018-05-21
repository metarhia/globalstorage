'use strict';

const metasync = require('metasync');

const subtests = ['memory', 'mongodb'];
metasync(
  subtests.map(name => require('./' + name).test)
)(() => {
  process.exit(0);
});
