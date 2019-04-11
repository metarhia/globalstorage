'use strict';

const { Pool } = require('pg');
const { test } = require('metatests');

const { PostgresCursor } = require('../lib/pg.cursor');

const { pgOptions } = require('./utils');

const tableName = 'GSTestTable';

const pool = new Pool(pgOptions);

const now = Date.now();
const rowData = [
  { id: 1, text: 'aaa', date: new Date(now - 1000) },
  { id: 2, text: 'aaa', date: new Date(now - 1000) },
  { id: 3, text: 'bbb', date: new Date(now - 5000) },
  { id: 4, text: 'bbb', date: new Date(now - 5000) },
  { id: 5, text: 'ccc', date: new Date(now - 1000) },
];

test('PostgresCursor test', async test => {
  try {
    await pool.query(`DROP TABLE IF EXISTS "${tableName}"`);
    await pool.query(
      `CREATE TABLE "${tableName}" (
         id int,
         text varchar(255),
         date timestamp with time zone)`
    );
    const insert =
      `INSERT INTO "${tableName}" (id, text, date) VALUES ` +
      rowData
        .map(row => `(${row.id}, '${row.text}', '${row.date.toISOString()}')`)
        .join(', ');
    await pool.query(insert);
  } catch (err) {
    console.error('Cannot setup PostgresDB, skipping PostgresCursor tests.');
    console.error(err);
    test.end();
    return;
  }

  test.endAfterSubtests();

  test.beforeEach((test, callback) => {
    const provider = {
      schema: { categories: new Map([[tableName, {}]]) },
      pool,
    };
    const cursor = new PostgresCursor(provider, { category: tableName });
    callback({ cursor });
  });

  test.test('Select all', async (test, { cursor }) => {
    const rows = await cursor.fetch();
    test.strictSame(rows, rowData);
    test.end();
  });

  test.test('Select few', async (test, { cursor }) => {
    const expected = rowData.filter(row => row.text === 'aaa');
    const rows = await cursor.select({ text: 'aaa' }).fetch();
    test.strictSame(rows, expected);
    test.end();
  });

  test.test('Select few !=', async (test, { cursor }) => {
    const expected = rowData.filter(row => row.text !== 'aaa');
    const rows = await cursor.select({ text: '!aaa' }).fetch();
    test.strictSame(rows, expected);
    test.end();
  });

  test.test('Select few row', async (test, { cursor }) => {
    const data = rowData.find(row => row.text === 'aaa');
    const expected = Object.keys(data).map(k => data[k]);
    const rows = await cursor
      .select({ text: 'aaa' })
      .row()
      .fetch();
    test.strictSame(rows, expected);
    test.end();
  });

  test.test('Select few date', async (test, { cursor }) => {
    const date = rowData[0].date;
    const expected = rowData.filter(
      row => row.date.getTime() === date.getTime()
    );
    const rows = await cursor.select({ date }).fetch();
    test.strictSame(rows, expected);
    test.end();
  });

  test.test('Select few projection', async (test, { cursor }) => {
    const expected = rowData
      .filter(row => row.text === 'aaa')
      .map(row => ({ id: row.id, text: row.text }));
    const rows = await cursor
      .select({ text: 'aaa' })
      .projection(['id', 'text'])
      .fetch();
    test.strictSame(rows, expected);
    test.end();
  });

  test.test('Select few projection complex', async (test, { cursor }) => {
    const expected = rowData
      .filter(row => row.text === 'aaa')
      .map(row => ({ t: row.text + '42' }));
    const rows = await cursor
      .select({ text: 'aaa' })
      .projection({ t: ['text', t => t + '42'] })
      .fetch();
    test.strictSame(rows, expected);
    test.end();
  });

  test.on('done', async () => {
    await pool.query(`DROP TABLE "${tableName}"`);
    pool.end();
  });
});
