'use strict';

const api = {};
api.gs = require('..');
api.metasync = require('metasync');

['provider.memory']
  .forEach(test => require('./' + test)(api));
