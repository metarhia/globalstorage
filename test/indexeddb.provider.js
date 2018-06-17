'use strict';

const metatests = require('metatests');
const metasync = require('metasync');
const { IndexedDBProvider } = require('..');
const indexedDB = require('fake-indexeddb');

const open = (callback) => {
  const provider = new IndexedDBProvider();
  provider.open({ indexedDB }, (err) => {
    if (err) return callback(err);
    callback(null, provider);
  });
};

const generateIdTest = (provider, done) => (test) => {
  provider.generateId((err, id) => {
    test.strictSame(err, null);
    test.strictSame(id, 0);
    provider.generateId((err, id) => {
      test.strictSame(err, null);
      test.strictSame(id, 1);
      test.end('indexeddb provider end');
      done();
    });
  });
};

const operationsTest = (provider, done) => (test) => {
  const obj = { name: 'qwerty' };
  provider.create(obj, (err, id) => {
    test.strictSame(err, null);
    const expected = { name: 'qwerty', address: 'ytrewq', id };
    const obj2 = { address: 'ytrewq', id };
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
            done();
          });
        });
      });
    });
  });
};

const selectTest = (provider, done) => (test) => {
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

  metasync.map(persons, (person, done) => {
    provider.create(person, (err, id) => {
      if (err) {
        console.log('Error: ', err);
      }
      //test.strictSame(err, null);
      done(null, id);
    });
  }, (err, ids) => {
    for (let i = 0; i < expected.length; i++) {
      expected[i].id = ids[i];
    }

    provider.select({}).fetch((err, ds) => {
      test.strictSame(err, null);
      test.strictSame(ds, expected);
      test.end('localstorage provider end');
      done();
    });
  });
};

module.exports = (data, done) => {
  open((err, provider) => {
    if (err) {
      return done(new Error('error opening indexed db provider: ' + err));
    }
    const tests = [{
      name: 'indexeddb provider: generateId',
      test: generateIdTest,
    }, {
      name: 'indexeddb provider: create, update, get, delete, get',
      test: operationsTest,
    }, {
      name: 'indexeddb provider: select',
      test: selectTest,
    }].map(({ name, test }) => (data, done) =>
      metatests.test(name, test(provider, done))
    );
    metasync(tests)(() => {
      done();
    });
  });
};
