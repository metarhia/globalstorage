'use strict';

const gs = require('..');
const metatests = require('metatests');
const metasync = require('metasync');

const testItemFieldChange = (done) => (test) => {
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
  done();
};

const testPopItem = (done) => (test) => {
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
  done();
};

const testReassignItem = (done) => (test) => {
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
  done();
};

const testPushingItem = (done) => (test) => {
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
  done();
};

const testRollbackCommit = (done) => (test) => {
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
  done();
};

const testClone = (done) => (test) => {
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
  done();
};

module.exports = (data, done) => {
  metasync([{
    name: 'dataset transaction: item field change',
    test: testItemFieldChange,
  }, {
    name: 'dataset transaction: pop item',
    test: testPopItem,
  }, {
    name: 'dataset transaction: reassign item',
    test: testReassignItem,
  }, {
    name: 'dataset transaction: pushing item',
    test: testPushingItem,
  }, {
    name: 'dataset transaction: rollback, commit',
    test: testRollbackCommit,
  }, {
    name:  'dataset transaction: clone',
    test: testClone,
  }].map(
    ({ name, test }) => (data, done) => metatests.test(name, test(done)))
  )(done);
};
