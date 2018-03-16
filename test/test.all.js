'use strict';

const api = {};
api.gs = require('..');
api.metasync = require('metasync');

['memory', 'mongodb']
  .forEach(test => require('./' + test)(api));
