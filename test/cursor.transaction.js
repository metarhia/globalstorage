'use strict';

const gs = require('..');
const mt = require('metatests');

mt.test('cursor tansaction: change field of dataset item', (test) => {
  const ds = [{ id: 1 }, { id: 2 }];
  const expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  const mc = new gs.MemoryCursor(ds);
  const transaction = gs.CursorTransaction.start(mc);
  transaction.dataset[0].name = 'qwerty';
  transaction.commit();
  test.strictSame(ds, expected);
  test.end('cursor transaction end');
});

mt.test('cursor tansaction: clone', (test) => {
  const ds = [{ id: 1 }, { id: 2 }];
  const expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  const mc = new gs.MemoryCursor(ds);
  const transaction = gs.CursorTransaction.start(mc);
  transaction.dataset[0].name = 'qwerty';
  transaction.clone().commit();
  test.strictSame(ds, expected);
  test.end('cursor transaction end');
});
