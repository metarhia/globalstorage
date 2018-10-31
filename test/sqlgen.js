'use strict';

const { testSync } = require('metatests');
const { SelectBuilder } = require('../lib/sqlgen');

testSync('Select tests', test => {
  test.beforeEach(
    (test, callback) => callback({ builder: new SelectBuilder() })
  );

  test.testSync('Simple all', (test, { builder }) => {
    builder.from('table');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table"');
    test.strictSame(params, []);
  });

  test.testSync('Simple distinct select all', (test, { builder }) => {
    builder.from('table').distinct();
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT DISTINCT * FROM "table"');
    test.strictSame(params, []);
  });

  test.testSync('Simple field', (test, { builder }) => {
    builder.select('a').from('table');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT "a" FROM "table"');
    test.strictSame(params, []);
  });

  test.testSync('Simple multiple field', (test, { builder }) => {
    builder.select('a', 'b').from('table');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT "a", "b" FROM "table"');
    test.strictSame(params, []);
  });

  test.testSync('Simple distinct multiple field', (test, { builder }) => {
    builder.select('a', 'b').from('table').distinct();
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT DISTINCT "a", "b" FROM "table"');
    test.strictSame(params, []);
  });

  test.testSync('Select all single where', (test, { builder }) => {
    builder.from('table').where('f1', '=', 3);
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" = $1');
    test.strictSame(params, [3]);
  });

  test.testSync('Select all single where not', (test, { builder }) => {
    builder.from('table').whereNot('f1', '=', 3);
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE NOT "f1" = $1');
    test.strictSame(params, [3]);
  });

  test.testSync('Select all multiple where', (test, { builder }) => {
    builder.from('table').where('f1', '=', 3).where('f2', '<', 'abc');
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT * FROM "table" WHERE "f1" = $1 AND "f2" < $2');
    test.strictSame(params, [3, 'abc']);
  });

  test.testSync('Select all multiple where count', (test, { builder }) => {
    builder.from('table')
      .where('f1', '=', 3)
      .where('f2', '<', 'abc')
      .count('f0');
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT count("f0") FROM "table" WHERE "f1" = $1 AND "f2" < $2');
    test.strictSame(params, [3, 'abc']);
  });

  test.testSync('Select few where avg', (test, { builder }) => {
    builder.from('table')
      .select('f1', 'f2')
      .where('f1', '=', 3)
      .avg('f0');
    // Note that this is not a corerct postgre SQL query as the select fields
    // are not present in the groupBy section. PG will fail with:
    // 'ERROR: column "table.f1", "table.f2" must appear in the GROUP BY clause
    //  or be used in an aggregate function'.
    //  But this is not the job of an SQL generator to catch these
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT "f1", "f2", avg("f0") FROM "table" WHERE "f1" = $1');
    test.strictSame(params, [3]);
  });

  test.testSync('Select few where avg', (test, { builder }) => {
    builder.from('table')
      .select('f1', 'f2')
      .where('f1', '=', 3)
      .groupBy('f1', 'f2')
      .min('f0');
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT "f1", "f2", min("f0") FROM "table" ' +
      'WHERE "f1" = $1 GROUP BY "f1", "f2"');
    test.strictSame(params, [3]);
  });

  test.testSync('Select all where max', (test, { builder }) => {
    builder.from('table')
      .where('f2', '=', 3)
      .max('f1');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT max("f1") FROM "table" WHERE "f2" = $1');
    test.strictSame(params, [3]);
  });

  test.testSync('Select all where limit', (test, { builder }) => {
    builder.from('table')
      .where('f2', '=', 3)
      .limit(10);
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1 LIMIT $2');
    test.strictSame(params, [3, 10]);
  });

  test.testSync('Select all where offset', (test, { builder }) => {
    builder.from('table')
      .where('f2', '=', 3)
      .offset(10);
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1 OFFSET $2');
    test.strictSame(params, [3, 10]);
  });

  test.testSync('Select all order offset', (test, { builder }) => {
    builder.from('table')
      .orderBy('f1')
      .offset(10);
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" ORDER BY "f1" ASC OFFSET $1');
    test.strictSame(params, [10]);
  });

  test.testSync('Select few order desc limit', (test, { builder }) => {
    builder.from('table')
      .select('f1', 'f2')
      .orderBy('f1', 'desc')
      .limit(10);
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT "f1", "f2" FROM "table" ORDER BY "f1" DESC LIMIT $1');
    test.strictSame(params, [10]);
  });

  test.testSync('Select few where order limit offset', (test, { builder }) => {
    builder.from('table')
      .select('f1')
      .where('f2', '=', 3)
      .offset(10)
      .orderBy('f1')
      .select('f3');
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT "f1", "f3" FROM "table" WHERE "f2" = $1 ' +
      'ORDER BY "f1" ASC OFFSET $2');
    test.strictSame(params, [3, 10]);
  });

  test.testSync('Select where date', (test, { builder }) => {
    const date = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    builder.from('table')
      .where('f2', '=', date, { date: 'date' });
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1');
    test.strictSame(params, [date]);
  });

  test.testSync('Select where time with timezone', (test, { builder }) => {
    const time = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    builder.from('table')
      .where('f2', '=', time, { date: 'time with time zone' });
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1');
    test.strictSame(params, [time]);
  });

  test.testSync('Select where timestamp with timezone', (test, { builder }) => {
    const time = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    builder.from('table')
      .where('f2', '=', time, { date: 'timestamp with time zone' });
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1');
    test.strictSame(params, [time]);
  });

  test.testSync('Select where in numbers', (test, { builder }) => {
    builder.from('table')
      .whereIn('f1', [1, 2, 3]);
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" IN ($1, $2, $3)');
    test.strictSame(params, [1, 2, 3]);
  });

  test.testSync('Select where not in numbers', (test, { builder }) => {
    builder.from('table')
      .whereNotIn('f1', [1, 2, 3]);
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT * FROM "table" WHERE "f1" NOT IN ($1, $2, $3)');
    test.strictSame(params, [1, 2, 3]);
  });

  test.testSync('Select multiple operations', (test, { builder }) => {
    builder.from('table')
      .avg('f1')
      .sum('f2');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT avg("f1"), sum("f2") FROM "table"');
    test.strictSame(params, []);
  });

  test.testSync('Select multiple operations groupBy', (test, { builder }) => {
    builder.from('table')
      .avg('f1')
      .sum('f2')
      .groupBy('a', 'b');
    const [query, params] = builder.build();
    test.strictSame(query,
      'SELECT avg("f1"), sum("f2") FROM "table" GROUP BY "a", "b"');
    test.strictSame(params, []);
  });

  test.testSync('Select where like', (test, { builder }) => {
    builder.from('table')
      .where('f1', 'like', 'abc');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" LIKE $1');
    test.strictSame(params, ['abc']);
  });

  test.testSync('Select where !=', (test, { builder }) => {
    builder.from('table')
      .where('f1', '!=', 'abc');
    const [query, params] = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" != $1');
    test.strictSame(params, ['abc']);
  });
}, { parallelSubtests: true });
