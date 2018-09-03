'use strict';

const gs = require('..');
const metaschema = require('metaschema');

const ds1 = [ { id: 1, name: 'qwerty' }, { id: 2 } ];
const ds2 = [ { id: 2 }, { id: 3 } ];

api.metatests.test('dataset operation', (test) => {
  const union = gs.transformations.union(ds1, ds2);
  const unionExpected = [{ id: 1, name: 'qwerty' }, { id: 2 }, { id: 3 }];
  test.strictSame(union, unionExpected, 'union should have all ids');
  const inter = gs.transformations.intersection(ds1, ds2);
  const interExpected = [{ id: 2 }];
  test.strictSame(inter, interExpected, 'intersection should have only id 2');
  const diff = gs.transformations.difference(ds1, ds2);
  const diffExpected = [{ id: 1, name: 'qwerty' }];
  test.strictSame(diff, diffExpected, 'diffirence should have only id 1');
  const comp = gs.transformations.complement(ds1, ds2);
  const compExpected = [{ id: 3 }];
  test.strictSame(comp, compExpected, 'complement should have only id 3');
  test.end('operation tests done');
});

api.metatests.test('datasets tests', (test) => {
  const mc1 = new gs.MemoryCursor(ds1, () => {});
  const mc2 = mc1.clone();
  const ds1Expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  test.strictSame(mc1.dataset, ds1Expected, 'Dataset 1 should be changed');
  const ds2Expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
  test.strictSame(mc2.dataset, ds2Expected, 'Dataset 2 should be the same');
  test.end('datasets tests done');
});

api.metatests.test('sort order', (test) => {
  const mc = new gs.MemoryCursor(ds1, () => {});
  mc.clone()
    .order('id')
    .fetch((err, data) => {
      if (err) return test.throws(err, 'test order 1');
      const expected = [{ id: 1, name: 'qwerty' }, { id: 2 }];
      test.strictSame(data, expected, 'Wrong data');
      test.end('test order 1 done');
    });
});

api.metatests.test('sort order desc', (test) => {
  const mc = new gs.MemoryCursor(ds1, () => {});
  mc.clone()
    .desc(['id', 'name'])
    .fetch((err, data) => {
      const expected = [{ id: 2 }, { id: 1, name: 'qwerty' }];
      test.strictSame(data, expected, 'Wrong data');
      test.end('test order 2 done');
    });
});

api.metatests.test('cursor select', (test) => {
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
    });
});

api.metatests.test('cursor schema', (test) => {
  const languages = [
    { Name: 'English', Locale: 'en' },
    { Name: 'Ukrainian', Locale: 'uk' },
    { Name: 'Russian', Locale: 'ru' },
  ];
  metaschema.load('schemas/system', (err, schemas) => {
    if (err) throw err;
    metaschema.build(schemas);
    const { definition } = metaschema.categories.get('Language');
    const mcLanguages = new gs.MemoryCursor(languages).metadata(definition);
    mcLanguages.select({ Locale: '> en' })
      .order('Name')
      .fetch((err, data, cursor) => {
        test.strictSame(data.length, 2);
        test.strictSame(Object.keys(cursor.schema).length, 2);
        test.end();
      });
  });
});
