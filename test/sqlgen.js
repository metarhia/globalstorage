'use strict';

const { testSync } = require('metatests');
const { SelectBuilder } = require('../lib/sqlgen');

testSync('Select tests', test => {
  test.beforeEach(
    (test, callback) => callback({ builder: new SelectBuilder() })
  );

  test.testSync('Simple all', (test, { builder }) => {
    builder.from('table');
    test.strictSame(builder.toString(), 'SELECT * FROM table');
  });

  test.testSync('Simple distinct select all', (test, { builder }) => {
    builder.from('table').distinct();
    test.strictSame(builder.toString(), 'SELECT DISTINCT * FROM table');
  });

  test.testSync('Simple field', (test, { builder }) => {
    builder.select('a').from('table');
    test.strictSame(builder.toString(), 'SELECT a FROM table');
  });

  test.testSync('Simple multiple field', (test, { builder }) => {
    builder.select('a', 'b').from('table');
    test.strictSame(builder.toString(), 'SELECT a, b FROM table');
  });

  test.testSync('Simple distinct multiple field', (test, { builder }) => {
    builder.select('a', 'b').from('table').distinct();
    test.strictSame(builder.toString(),
      'SELECT DISTINCT a, b FROM table');
  });

  test.testSync('Select all single where', (test, { builder }) => {
    builder.from('table').where('f1', '=', 3);
    test.strictSame(builder.toString(),
      'SELECT * FROM table WHERE f1 = 3');
  });

  test.testSync('Select all single where not', (test, { builder }) => {
    builder.from('table').whereNot('f1', '=', 3);
    test.strictSame(builder.toString(),
      'SELECT * FROM table WHERE NOT f1 = 3');
  });

  test.testSync('Select all multiple where', (test, { builder }) => {
    builder.from('table').where('f1', '=', 3).where('f2', '<', 'abc');
    test.strictSame(builder.toString(),
      // eslint-disable-next-line quotes
      `SELECT * FROM table WHERE f1 = 3 AND f2 < 'abc'`);
  });

  test.testSync('Select all multiple where count', (test, { builder }) => {
    builder.from('table')
      .where('f1', '=', 3)
      .where('f2', '<', 'abc')
      .count('f0');
    test.strictSame(builder.toString(),
      // eslint-disable-next-line quotes
      `SELECT count(f0) FROM table WHERE f1 = 3 AND f2 < 'abc'`);
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
    test.strictSame(builder.toString(),
      'SELECT f1, f2, avg(f0) FROM table WHERE f1 = 3');
  });

  test.testSync('Select few where avg', (test, { builder }) => {
    builder.from('table')
      .select('f1', 'f2')
      .where('f1', '=', 3)
      .groupBy('f1', 'f2')
      .min('f0');
    test.strictSame(builder.toString(),
      'SELECT f1, f2, min(f0) FROM table ' +
      'WHERE f1 = 3 GROUP BY f1, f2');
  });

  test.testSync('Select all where max', (test, { builder }) => {
    builder.from('table')
      .where('f2', '=', 3)
      .max('f1');
    test.strictSame(builder.toString(),
      'SELECT max(f1) FROM table WHERE f2 = 3');
  });

  test.testSync('Select all where limit', (test, { builder }) => {
    builder.from('table')
      .where('f2', '=', 3)
      .limit(10);
    test.strictSame(builder.toString(),
      'SELECT * FROM table WHERE f2 = 3 LIMIT 10');
  });

  test.testSync('Select all where offset', (test, { builder }) => {
    builder.from('table')
      .where('f2', '=', 3)
      .offset(10);
    test.strictSame(builder.toString(),
      'SELECT * FROM table WHERE f2 = 3 OFFSET 10');
  });

  test.testSync('Select all order offset', (test, { builder }) => {
    builder.from('table')
      .orderBy('f1')
      .offset(10);
    test.strictSame(builder.toString(),
      'SELECT * FROM table ORDER BY f1 ASC OFFSET 10');
  });

  test.testSync('Select few order desc limit', (test, { builder }) => {
    builder.from('table')
      .select('f1', 'f2')
      .orderBy('f1', 'desc')
      .limit(10);
    test.strictSame(builder.toString(),
      'SELECT f1, f2 FROM table ORDER BY f1 DESC LIMIT 10');
  });

  test.testSync('Select few where order limit offset', (test, { builder }) => {
    builder.from('table')
      .select('f1')
      .where('f2', '=', 3)
      .offset(10)
      .orderBy('f1')
      .select('f3');
    test.strictSame(builder.toString(),
      'SELECT f1, f3 FROM table WHERE f2 = 3 ' +
      'ORDER BY f1 ASC OFFSET 10');
  });

  test.testSync('Select where date', (test, { builder }) => {
    const date = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    const dateStr = date.toISOString();
    builder.from('table')
      .where('f2', '=', date, { date: 'date' });
    test.strictSame(builder.toString(),
      `SELECT * FROM table WHERE f2 = '${dateStr}'`);
  });

  test.testSync('Select where time with timezone', (test, { builder }) => {
    const time = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    const timeStr = time.toISOString();
    builder.from('table')
      .where('f2', '=', time, { date: 'time with time zone' });
    test.strictSame(builder.toString(),
      `SELECT * FROM table WHERE f2 = '${timeStr}'`);
  });

  test.testSync('Select where timestamp with timezone', (test, { builder }) => {
    const time = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    const timeStr = time.toISOString();
    builder.from('table')
      .where('f2', '=', time, { date: 'timestamp with time zone' });
    test.strictSame(builder.toString(),
      `SELECT * FROM table WHERE f2 = '${timeStr}'`);
  });

  test.testSync('Select where in numbers', (test, { builder }) => {
    builder.from('table')
      .whereIn('f1', [1, 2, 3]);
    test.strictSame(builder.toString(),
      'SELECT * FROM table WHERE f1 IN (1, 2, 3)');
  });

  test.testSync('Select where not in numbers', (test, { builder }) => {
    builder.from('table')
      .whereNotIn('f1', [1, 2, 3]);
    test.strictSame(builder.toString(),
      'SELECT * FROM table WHERE NOT f1 IN (1, 2, 3)');
  });
}, { parallelSubtests: true });
