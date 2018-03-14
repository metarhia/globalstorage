'use strict';

const api = {};
api.gs = require('..');
api.metasync = require('metasync');

['provider.memory', 'provider.mongodb']
  .forEach(test => require('./' + test)(api));
