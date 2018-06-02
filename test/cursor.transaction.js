'use strict';

const gs = require('..');
const metatests = require('metatests');
const metasync = require('metasync');

const testChange = (done) => (test) => {
  const ds = [{ id: 1 }, { id: 2 }];
  const expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  const mc = new gs.MemoryCursor(ds);
  const transaction = gs.CursorTransaction.start(mc);
  transaction.dataset[0].name = 'qwerty';
  transaction.commit();
  test.strictSame(ds, expected);
  test.end('cursor transaction end');
  done();
};

const testClone = (done) => (test) => {
  const ds = [{ id: 1 }, { id: 2 }];
  const expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  const mc = new gs.MemoryCursor(ds);
  const transaction = gs.CursorTransaction.start(mc);
  transaction.dataset[0].name = 'qwerty';
  transaction.clone().commit();
  test.strictSame(ds, expected);
  test.end('cursor transaction end');
  done();
};

module.exports = (data, done) => {
  metasync([{
    name: 'cursor tansaction: change field of dataset item',
    test: testChange,
  }, {
    name: 'cursor tansaction: clone',
    test: testClone,
  }].map(
    ({ name, test }) => (data, done) => metatests.test(name, test(done))
  ))(done);
};
