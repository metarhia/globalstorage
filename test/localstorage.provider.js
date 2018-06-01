'use strict';

const metasync = require('metasync');
const metatests = require('metatests');
const { LocalstorageProvider } = require('..');
const localStorage = require('localStorage');

const open = (callback) => {
  const provider = new LocalstorageProvider();
  provider.open({ localStorage }, (err) => {
    if (err) return callback(err);
    callback(null, provider);
  });
};

const testClose = (done) => (test) => {
  open((err, provider) => {
    test.strictSame(err, null);
    provider.close((err) => {
      test.strictSame(err, null);
      test.end('localstorage provider end');
      done();
    });
  });
};


const testGenerateId = (done) => (test) => {
  localStorage[LocalstorageProvider.ID_LABEL] = 0;
  open((err, provider) => {
    test.strictSame(err, null);
    provider.generateId((err, id) => {
      test.strictSame(err, null);
      test.strictSame(id, 0);
      provider.generateId((err, id) => {
        test.strictSame(err, null);
        test.strictSame(id, 1);
        test.end('localstorage provider end');
        done();
      });
    });
  });
};

const testOperations = (done) => (test) => {
  const obj = { name: 'qwerty' };
  open((err, provider) => {
    test.strictSame(err, null);
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
              done();
            });
          });
        });
      });
    });
  });
};

const testSelect = (done) => (test) => {
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

  open((err, provider) => {
    test.strictSame(err, null);
    persons.forEach((person, i) => provider.create(person, (err, id) => {
      test.strictSame(err, null);
      expected[i].id = id;
    }));
    provider.select({}).fetch((err, ds) => {
      test.strictSame(err, null);
      test.strictSame(ds, expected);
      test.end('localstorage provider end');
      done();
    });
  });
};

module.exports = (data, done) => {
  metasync([
    (data, done) => {
      metatests.test('localstorage provider: close', testClose(done));
    },
    (data, done) => {
      metatests.test('localstorage provider: generateId', testGenerateId(done));
    },
    (data, done) => {
      metatests.test('localstorage provider: create, update, get, delete, get',
        testOperations(done)
      );
    },
    (data, done) => {
      metatests.test('localstorage provider: select', testSelect(done));
    },
  ])(done);
};
