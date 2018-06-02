'use strict';

const gs = require('..');
const metatests = require('metatests');

const testTransaction = (done) => (test) => {
  const data = { name: 'Marcus Aurelius', born: 121 };
  const transaction = gs.Transaction.start(data);
  const date = new Date('Sat Jun 02 2018 13:15:39 GMT+0300');

  transaction.name = 'Mao Zedong';
  transaction.born = 1893;
  transaction.city = 'Shaoshan';
  transaction.age = (
    date.getFullYear() -
    new Date(transaction.born + '').getFullYear()
  );

  test.strictSame(transaction, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });
  test.strictSame(transaction.delta, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });

  transaction.commit();
  test.strictSame(data, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });
  test.strictSame(transaction, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });
  test.strictSame(transaction.delta, {});

  transaction.born = 1976;
  test.strictSame(transaction, {
    name: 'Mao Zedong',
    born: 1976,
    city: 'Shaoshan',
    age: 125,
  });
  test.strictSame(transaction.delta, { born: 1976 });

  transaction.rollback();
  test.strictSame(data, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });
  test.strictSame(transaction, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });
  test.strictSame(transaction.delta, {});

  transaction.city = 'Beijing';
  delete transaction.born;

  test.strictSame(Object.keys(transaction), [ 'name', 'born', 'city', 'age' ]);
  test.strictSame(transaction.delta, { city: 'Beijing' });
  test.strictSame(data, {
    name: 'Mao Zedong',
    born: 1893,
    city: 'Shaoshan',
    age: 125,
  });

  transaction.commit();
  test.strictSame(data, {
    name: 'Mao Zedong',
    city: 'Beijing',
    age: 125,
  });

  done();
};

module.exports = (data, done) => {
  metatests.test('transaction test', testTransaction(done));
};
