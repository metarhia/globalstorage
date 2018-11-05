'use strict';

const gs = require('..');
const metaschema = require('metaschema');
const metatests = require('metatests');

const ds1 = [ { Id: 1, Name: 'qwerty' }, { Id: 2 } ];
const ds2 = [ { Id: 2 }, { Id: 3 } ];

metatests.test('dataset operation', test => {
  const union = gs.transformations.union(ds1, ds2);
  const unionExpected = [{ Id: 1, Name: 'qwerty' }, { Id: 2 }, { Id: 3 }];
  test.strictSame(union, unionExpected, 'union should have all ids');
  const inter = gs.transformations.intersection(ds1, ds2);
  const interExpected = [{ Id: 2 }];
  test.strictSame(inter, interExpected, 'intersection should have only id 2');
  const diff = gs.transformations.difference(ds1, ds2);
  const diffExpected = [{ Id: 1, Name: 'qwerty' }];
  test.strictSame(diff, diffExpected, 'diffirence should have only id 1');
  const comp = gs.transformations.complement(ds1, ds2);
  const compExpected = [{ Id: 3 }];
  test.strictSame(comp, compExpected, 'complement should have only id 3');
  test.end('operation tests done');
});

metatests.test('datasets tests', test => {
  const mc1 = new gs.MemoryCursor(ds1);
  const mc2 = mc1.clone();
  const ds1Expected = [{ Id: 1, Name: 'qwerty' }, { Id: 2 }];
  test.strictSame(mc1.dataset, ds1Expected, 'Dataset 1 should be changed');
  const ds2Expected = [{ Id: 1, Name: 'qwerty' }, { Id: 2 }];
  test.strictSame(mc2.dataset, ds2Expected, 'Dataset 2 should be the same');
  test.end('datasets tests done');
});

metatests.test('limit test', test => {
  const ds = [ { Id: 2 }, { Id: 3 } ];
  new gs.MemoryCursor(ds)
    .limit(1)
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data, ds.slice(0, 1));
      test.end();
    });
});

metatests.test('offset test', test => {
  const ds = [ { Id: 2 }, { Id: 3 } ];
  new gs.MemoryCursor(ds)
    .offset(1)
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data, ds.slice(1));
      test.end();
    });
});

metatests.test('limit offset test', test => {
  const ds = [ { Id: 2 }, { Id: 3 }, { Id: 4 }, { Id: 5 } ];
  new gs.MemoryCursor(ds)
    .offset(2)
    .limit(1)
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data, ds.slice(2, 3));
      test.end();
    });
});

metatests.test('count all test', test => {
  const ds = [ { Id: 2, a: 1 }, { Id: 3, a: 2 }, { Id: 4 } ];
  new gs.MemoryCursor(ds)
    .count()
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data, [ds.length]);
      test.end();
    });
});

metatests.test('count field test', test => {
  const ds = [ { Id: 2, a: 1 }, { Id: 3, a: 2 }, { Id: 4 } ];
  new gs.MemoryCursor(ds)
    .count('a')
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data, [ds.filter(d => d.hasOwnProperty('a')).length]);
      test.end();
    });
});

metatests.test('sort order', test => {
  const mc = new gs.MemoryCursor(ds1);
  mc.clone()
    .order('Id')
    .fetch((err, data) => {
      test.error(err, 'test order 1');
      const expected = [{ Id: 1, Name: 'qwerty' }, { Id: 2 }];
      test.strictSame(data, expected, 'Wrong data');
      test.end('test order 1 done');
    });
});

metatests.test('sort order desc', test => {
  const mc = new gs.MemoryCursor(ds1);
  mc.clone()
    .desc(['Id', 'Name'])
    .fetch((err, data) => {
      test.error(err);
      const expected = [{ Id: 2 }, { Id: 1, Name: 'qwerty' }];
      test.strictSame(data, expected, 'Wrong data');
      test.end('test order 2 done');
    });
});

metatests.test('cursor select', test => {
  const persons = [
    { Id: 1, Name: 'Marcus Aurelius', City: 'Rome', Born: 121 },
    { Id: 2, Name: 'Victor Glushkov', City: 'Rostov on Don', Born: 1923 },
    { Id: 3, Name: 'Ibn Arabi', City: 'Murcia', Born: 1165 },
    { Id: 4, Name: 'Mao Zedong', City: 'Shaoshan', Born: 1893 },
    { Id: 5, Name: 'Rene Descartes', City: 'La Haye en Touraine', Born: 1596 },
  ];
  const mcPersons = new gs.MemoryCursor(persons);
  mcPersons.select({ Born: '< 1500' })
    .order('Born')
    .fetch((err, data) => {
      test.error(err);
      const expected = [
        { Id: 3, Name: 'Ibn Arabi', City: 'Murcia', Born: 1165 },
        { Id: 1, Name: 'Marcus Aurelius', City: 'Rome', Born: 121 },
      ];
      test.strictSame(data, expected, 'Wrong data');
      test.end('select test done');
    });
});

metatests.test('cursor schema', test => {
  const languages = [
    { Id: 1, Name: 'English', Locale: 'en' },
    { Id: 2, Name: 'Ukrainian', Locale: 'uk' },
    { Id: 3, Name: 'Russian', Locale: 'ru' },
  ];
  metaschema.fs.loadAndCreate('schemas/system', null, (err, schema) => {
    test.error(err);
    const schemaName = 'Language';
    const category = schema.categories.get(schemaName).definition;
    const mcLanguages =
      new gs.MemoryCursor(languages).definition(category, schemaName);
    mcLanguages.select({ Locale: '> en' })
      .order('Name')
      .fetch((err, data, cursor) => {
        test.error(err);
        test.strictSame(data.length, 2);
        test.strictSame(Object.keys(cursor.schema).length, 2);
        test.end();
      });
  });
});

metatests.test('cursor union', test => {
  const languages1 = [
    { Id: 1, Name: 'English', Locale: 'en' },
  ];
  const languages2 = [
    { Id: 2, Name: 'Ukrainian', Locale: 'uk' },
    { Id: 3, Name: 'Russian', Locale: 'ru' },
  ];

  const mcLanguages1 = new gs.MemoryCursor(languages1);
  const mcLanguages2 = new gs.MemoryCursor(languages2);

  mcLanguages1.selectToMemory()
    .union(mcLanguages2)
    .order('Name')
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data.length, 3);
      test.end();
    });
});

metatests.test('cursor intersection', test => {
  const languages1 = [
    { Id: 1, Name: 'English', Locale: 'en' },
    { Id: 2, Name: 'Russian', Locale: 'ru' },
  ];
  const languages2 = [
    { Id: 3, Name: 'Ukrainian', Locale: 'uk' },
    { Id: 2, Name: 'Russian', Locale: 'ru' },
  ];

  const mcLanguages1 = new gs.MemoryCursor(languages1);
  const mcLanguages2 = new gs.MemoryCursor(languages2);

  mcLanguages1.selectToMemory()
    .intersection(mcLanguages2)
    .order('Name')
    .fetch((err, data) => {
      test.error(err);
      test.strictSame(data.length, 1);
      test.end();
    });
});
