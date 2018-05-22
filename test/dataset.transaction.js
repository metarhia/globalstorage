'use strict';

const gs = require('..');
const mt = require('metatests');

mt.test('dataset transaction: item field change', (test) => {
  const persons = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }];
  const expected = [{
    category: 'Person',
    name: 'Aristotele',
    city: 'Rome',
    born: 121,
  }];

  const transaction = gs.DatasetTransaction.start(persons);
  transaction[0].name = 'Aristotele';
  transaction.commit();
  test.strictSame(persons, expected);
  test.end('dataset transaction end');
});

mt.test('dataset transaction: pop item', (test) => {
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
  }];

  const transaction = gs.DatasetTransaction.start(persons);
  transaction.pop();
  transaction.commit();
  test.strictSame(persons, expected);
  test.end('dataset transaction end');
});

mt.test('dataset transaction: reassign item', (test) => {
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
    name: 'Mao Zedong',
    city: 'Shaoshan',
    born: 1893,
  }];

  const transaction = gs.DatasetTransaction.start(persons);
  transaction[1] = {
    category: 'Person',
    name: 'Mao Zedong',
    city: 'Shaoshan',
    born: 1893
  };
  transaction.commit();
  test.strictSame(persons, expected);
  test.end('dataset transaction end');
});

mt.test('dataset transaction: pushing item', (test) => {
  const persons = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }];
  const expected = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }, {
    category: 'Person',
    name: 'Ibn Arabi',
    city: 'Murcia',
    born: 1165
  }];

  const transaction = gs.DatasetTransaction.start(persons);
  transaction.push({
    category: 'Person',
    name: 'Ibn Arabi',
    city: 'Murcia',
    born: 1165
  });
  transaction.commit();
  test.strictSame(persons, expected);
  test.end('dataset transaction end');
});

mt.test('dataset transaction: rollback, commit', (test) => {
  const persons = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }];
  const expected = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Greece',
    born: 121,
  }];

  const transaction = gs.DatasetTransaction.start(persons);
  transaction[0].name = 'Aristotele';
  transaction.rollback();
  transaction[0].city = 'Greece';
  transaction.commit();
  test.strictSame(persons, expected);
  test.end('data transaction end');
});

mt.test('dataset transaction: clone', (test) => {
  const persons = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }];
  const expected = [{
    category: 'Person',
    name: 'Aristotele',
    city: 'Rome',
    born: 121,
  }];

  const transaction = gs.DatasetTransaction.start(persons);
  transaction[0].name = 'Aristotele';
  transaction.clone().commit();
  test.strictSame(persons, expected);
  test.end('data transaction end');
});
