'use strict';

const gs = require('..');
const metasync = require('metasync');
const mt = require('metatests');

const ds1 = [ { id: 1 }, { id: 2 } ];
const ds2 = [ { id: 2 }, { id: 3 } ];

const operationTests = (done) => (test) => {
  const union = gs.transformations.union(ds1, ds2);
  const unionExpected = [{ id: 1 }, { id: 2 }, { id: 3 }];
  test.strictSame(union, unionExpected, 'union should have all ids');
  const inter = gs.transformations.intersection(ds1, ds2);
  const interExpected = [{ id: 2 }];
  test.strictSame(inter, interExpected, 'intersection should have only id 2');
  const diff = gs.transformations.difference(ds1, ds2);
  const diffExpected = [{ id: 1 }];
  test.strictSame(diff, diffExpected, 'diffirence should have only id 1');
  const comp = gs.transformations.complement(ds1, ds2);
  const compExpected = [{ id: 3 }];
  test.strictSame(comp, compExpected, 'complement should have only id 3');
  test.end('operation tests done');
  done();
};

const testDatasets = (mc1, mc2, done) => (test) => {
  const ds1Expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  test.strictSame(mc1.dataset, ds1Expected, 'Dataset 1 should be changed');
  const ds2Expected = [{ id: 1 }, { id: 2 }];
  test.strictSame(mc2.dataset, ds2Expected, 'Dataset 2 should be the same');
  test.end('datasets tests done');
  done();
};

const testOrder1 = (mc, done) => (test) => {
  mc.clone()
    .order('id')
    .fetch((err, data) => {
      if (err) return test.throws(err, 'test order 1');
      const expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
      test.strictSame(data, expected, 'Wrong data');
      test.end('test order 1 done');
      done();
    });
};

const testOrder2 = (mc, done) => (test) => {
  mc.clone()
    .desc(['id', 'name'])
    .fetch((err, data) => {
      const expected = [{ id: 2 }, { id: 1, name: 'qwerty' }];
      test.strictSame(data, expected, 'Wrong data');
      test.end('test order 2 done');
      done();
    });
};

const testSelect = (done) => (test) => {
  const persons = [
    { name: 'Marcus Aurelius', city: 'Rome', born: 121 },
    { name: 'Victor Glushkov', city: 'Rostov on Don', born: 1923 },
    { name: 'Ibn Arabi', city: 'Murcia', born: 1165 },
    { name: 'Mao Zedong', city: 'Shaoshan', born: 1893 },
    { name: 'Rene Descartes', city: 'La Haye en Touraine', born: 1596 }
  ];

  const mcPersons = new gs.MemoryCursor(persons);
  mcPersons.select({ born: '< 1500' })
    .order('born')
    .fetch((err, data) => {
      const expected = [
        { name: 'Ibn Arabi', city: 'Murcia', born: 1165 },
        { name: 'Marcus Aurelius', city: 'Rome', born: 121 },
      ];
      test.strictSame(data, expected, 'Wrong data');
      test.end('select test done');
      done();
    });
};

const test = (data, done) => {
  mt.test('operation tests', operationTests);

  const mc1 = new gs.MemoryCursor(ds1, metasync.emptiness);
  const mc2 = mc1.clone();
  mc1.dataset[0].name = 'qwerty';

  metasync([
    (data, done) => mt.test('datasets tests', testDatasets(mc1, mc2, done)),
    (data, done) => mt.test('order 1 test', testOrder1(mc1, done)),
    (data, done) => mt.test('order 2 test', testOrder2(mc1, done)),
    (data, done) => mt.test('select test', testSelect(done)),
  ])(done);
};

module.exports = { test };
