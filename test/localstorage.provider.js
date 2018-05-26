'use strict';

const mt = require('metatests');
const { LocalstorageProvider } = require('..');
const localStorage = require('localStorage');

mt.test('localstorage provider: close', (test) => {
  new LocalstorageProvider().close((err) => {
    test.strictSame(err, null);
    test.end('localstorage provider end');
  });
});


mt.test('localstorage provider: generateId', (test) => {
  localStorage[LocalstorageProvider.ID_LABEL] = 0;
  const provider = new LocalstorageProvider();
  provider.generateId((err, id) => {
    test.strictSame(err, null);
    test.strictSame(id, 0);
    provider.generateId((err, id) => {
      test.strictSame(err, null);
      test.strictSame(id, 1);
      test.end('localstorage provider end');
    });
  });
});

mt.test('localstorage provider: create, update, get, delete, get', (test) => {
  const obj = { name: 'qwerty' };
  const provider = new LocalstorageProvider();

  provider.create(obj, (err, id) => {
    test.strictSame(err, null);
    const expected = { name: 'qwerty', address: 'ytrewq', id };
    const obj2 = { address: 'ytrewq' };
    Object.assign(obj2, obj);
    provider.update(obj2, (err) => {
      test.strictSame(err, null);
      provider.get(id, (err, obj3) => {
        test.strictSame(err, null);
        test.strictSame(obj3, expected);
        provider.delete(id, (err) => {
          test.strictSame(err, null);
          provider.get(id, (err, obj4) => {
            test.strictSame(err, null);
            test.strictSame(typeof obj4, 'undefined');
            test.end('localstorage provider end');
          });
        });
      });
    });
  });
});

mt.test('localstorage provider: select', (test) => {
  const provider = new LocalstorageProvider();
  const persons = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }, {
    category: 'Person',
    name: 'Victor Glushkov',
    city: 'Rostov on Don',
    born: 1923,
  }];
  const expected = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }, {
    category: 'Person',
    name: 'Victor Glushkov',
    city: 'Rostov on Don',
    born: 1923,
  }];

  persons.forEach((person, i) => provider.create(person, (err, id) => {
    test.strictSame(err, null);
    expected[i].id = id;
  }));
  provider.select({}).fetch((err, ds) => {
    test.strictSame(err, null);
    test.strictSame(ds, expected);
    test.end('localstorage provider end');
  });
});
