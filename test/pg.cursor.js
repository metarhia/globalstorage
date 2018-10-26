'use strict';

const { Pool } = require('pg');
const { test, testSync } = require('metatests');
const { sequential } = require('metasync');

const gs = require('..');
const { PostgresCursor } = gs;

const tableName = 'GSTestTable';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: 'localhost',
  database: process.env.DB_NAME || 'test_globalstorage_database',
  port: process.env.DB_PORT || 5432,
});

const now = Date.now();
const rowData = [
  { id: 1, text: 'aaa', date: new Date(now - 1000) },
  { id: 2, text: 'aaa', date: new Date(now - 1000) },
  { id: 3, text: 'bbb', date: new Date(now - 5000) },
  { id: 4, text: 'bbb', date: new Date(now - 5000) },
  { id: 5, text: 'ccc', date: new Date(now - 1000) },
];

function prepareDB(callback) {
  sequential([
    (data, cb) => pool.query(`DROP TABLE IF EXISTS "${tableName}"`, cb),
    (data, cb) => pool.query(
      `CREATE TABLE "${tableName}" (
         id int,
         text varchar(255),
         date timestamp with time zone)`,
      cb
    ),
    (data, cb) => {
      const insert =
        `INSERT INTO "${tableName}" (id, text, date) VALUES ` +
        rowData
          .map(row => `(${row.id}, '${row.text}', '${row.date.toISOString()}')`)
          .join(', ');
      pool.query(insert, cb);
    },
  ], callback);
}

test('PostgresCursor test', test => {

  prepareDB(err => {
    if (err) {
      console.error('Cannot setup PostgresDB, skipping PostgresCursor tests.');
      console.error(err);
      test.end();
      return;
    }

    test.endAfterSubtests();

    test.beforeEach((test, callback) => {
      pool.connect((err, client, done) => {
        test.error(err);
        const cursor = new PostgresCursor(client, { category: tableName });
        callback({ cursor, done });
      });
    });
    test.afterEach((test, callback) => {
      test.context.done();
      callback();
    });

    test.test('Select all', (test, { cursor }) => {
      cursor.fetch((err, rows) => {
        test.error(err);
        test.strictSame(rows, rowData);
        test.end();
      });
    });

    test.test('Select few', (test, { cursor }) => {
      const expected = rowData.filter(row => row.text === 'aaa');
      cursor.select({ text: 'aaa' })
        .fetch((err, rows) => {
          test.error(err);
          test.strictSame(rows, expected);
          test.end();
        });
    });

    test.test('Select few !=', (test, { cursor }) => {
      const expected = rowData.filter(row => row.text !== 'aaa');
      cursor.select({ text: '!aaa' })
        .fetch((err, rows) => {
          test.error(err);
          test.strictSame(rows, expected);
          test.end();
        });
    });

    test.test('Select few row', (test, { cursor }) => {
      const data = rowData.find(row => row.text === 'aaa');
      const expected = Object.keys(data).map(k => data[k]);
      cursor.select({ text: 'aaa' })
        .row()
        .fetch((err, rows) => {
          test.error(err);
          test.strictSame(rows, expected);
          test.end();
        });
    });

    test.test('Select few date', (test, { cursor }) => {
      const date = rowData[0].date;
      const expected = rowData
        .filter(row => row.date.getTime() === date.getTime());
      cursor.select({ date })
        .fetch((err, rows) => {
          test.error(err);
          test.strictSame(rows, expected);
          test.end();
        });
    });

    test.on('done', () => pool.end());
  });
});

testSync('PostgresCursor must be present in gs.cursors', test => {
  // eslint-disable-next-line new-cap
  const cursor = new gs.cursors.pg();
  test.type(cursor, 'PostgresCursor');
});
