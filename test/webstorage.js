'use strict';

const metatests = require('metatests');

const gs = require('..');
const Storage = require('./webstorage.mock');

gs.open({ gs, provider: 'webstorage', db: new Storage() }, err => {
  metatests.test('globalstorage connection', test => {
    test.error(err);
    test.end();
  });

  // TODO add more tests here
});
