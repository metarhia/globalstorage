'use strict';

const metasync = require('metasync');

const subtests = [
  require('./localstorage.provider'),
];

metasync(subtests)(() => {
  console.log('Tests have been executed');
});
