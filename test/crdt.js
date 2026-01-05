'use strict';

const test = require('node:test');
const assert = require('node:assert');
const gs = require('..');

test('CRDT module', async (t) => {
  await t.test('diff function - basic object diff', () => {
    const source = { a: 1, b: 2, c: 3 };
    const target = { a: 1, b: 20, d: 4 };
    const result = gs.diff(source, target);

    assert.deepStrictEqual(result, { b: 20, c: undefined, d: 4 });
  });

  await t.test('diff function - empty objects', () => {
    const source = {};
    const target = {};
    const result = gs.diff(source, target);

    assert.deepStrictEqual(result, {});
  });

  await t.test('diff function - new keys added', () => {
    const source = { a: 1 };
    const target = { a: 1, b: 2, c: 3 };
    const result = gs.diff(source, target);

    assert.deepStrictEqual(result, { b: 2, c: 3 });
  });

  await t.test('diff function - keys removed', () => {
    const source = { a: 1, b: 2, c: 3 };
    const target = { a: 1 };
    const result = gs.diff(source, target);

    assert.deepStrictEqual(result, { b: undefined, c: undefined });
  });

  await t.test('diff function - arrays/sets diff', () => {
    const source = { items: [1, 2, 3] };
    const target = { items: [1, 2, 3, 4, 5] };
    const result = gs.diff(source, target);

    assert.deepStrictEqual(result, { items: [4, 5] });
  });

  await t.test('diff function - nested objects', () => {
    const source = { user: { name: 'John', age: 30 } };
    const target = { user: { name: 'Jane', age: 30, city: 'NYC' } };
    const result = gs.diff(source, target);

    assert.deepStrictEqual(result, {
      user: { name: 'Jane', city: 'NYC' },
    });
  });

  await t.test('merge function - basic merge', () => {
    const source = { a: 1, b: 2 };
    const delta = { b: 20, c: 3 };
    const result = gs.merge(source, delta);

    assert.deepStrictEqual(result, { a: 1, b: 22, c: 3 });
  });

  await t.test('merge function - delete keys', () => {
    const source = { a: 1, b: 2, c: 3 };
    const delta = { b: undefined };
    const result = gs.merge(source, delta);

    assert.deepStrictEqual(result, { a: 1, c: 3 });
  });

  await t.test('merge function - arrays/sets merge', () => {
    const source = { items: [1, 2, 3] };
    const delta = { items: [3, 4, 5] };
    const result = gs.merge(source, delta);

    assert.deepStrictEqual(result, { items: [1, 2, 3, 4, 5] });
  });

  await t.test('merge function - counter merge', () => {
    const source = { count: 10 };
    const delta = { count: 5 };
    const result = gs.merge(source, delta);

    assert.strictEqual(result.count, 15);
  });

  await t.test('merge function - nested objects', () => {
    const source = { user: { name: 'John', age: 30 } };
    const delta = { user: { age: 31, city: 'NYC' } };
    const result = gs.merge(source, delta);

    assert.deepStrictEqual(result, {
      user: { name: 'John', age: 61, city: 'NYC' },
    });
  });

  await t.test('merge function - null/undefined delta', () => {
    const source = { a: 1, b: 2 };
    const result1 = gs.merge(source, null);
    const result2 = gs.merge(source, undefined);

    assert.deepStrictEqual(result1, source);
    assert.deepStrictEqual(result2, source);
  });

  await t.test('merge function - null source', () => {
    const delta = { a: 1, b: 2 };
    const result = gs.merge(null, delta);

    assert.deepStrictEqual(result, delta);
  });

  await t.test('apply function - write record', () => {
    const source = { a: 1, b: 2 };
    const history = [{ type: 'write', data: { c: 3, d: 4 } }];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 1, b: 2 });
  });

  await t.test('apply function - delta record', () => {
    const source = { a: 1, b: 2 };
    const history = [{ type: 'delta', data: { b: 20, c: 3 } }];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 1, b: 22, c: 3 });
  });

  await t.test('apply function - delete record', () => {
    const source = { a: 1, b: 2, c: 3 };
    const history = [{ type: 'delete', key: 'b' }];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 1, b: undefined, c: 3 });
  });

  await t.test('apply function - inc record', () => {
    const source = { count: 10 };
    const history = [{ type: 'inc', key: 'count', value: 5 }];
    const result = gs.apply(source, history);

    assert.strictEqual(result.count, 15);
  });

  await t.test('apply function - dec record', () => {
    const source = { count: 10 };
    const history = [{ type: 'dec', key: 'count', value: 3 }];
    const result = gs.apply(source, history);

    assert.strictEqual(result.count, 7);
  });

  await t.test('apply function - multiple records', () => {
    const source = { a: 1, b: 2 };
    const history = [
      { type: 'delta', data: { b: 20 } },
      { type: 'delta', data: { c: 3 } },
      { type: 'inc', key: 'a', value: 5 },
    ];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 6, b: 22, c: 3 });
  });

  await t.test('apply function - write preserves state', () => {
    const source = { a: 1, b: 2, c: 3 };
    const history = [
      { type: 'delta', data: { d: 4 } },
      { type: 'write', data: { x: 10 } },
    ];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 1, b: 2, c: 3, d: 4 });
  });

  await t.test('apply function - invalid history', () => {
    const source = { a: 1 };
    const result1 = gs.apply(source, null);
    const result2 = gs.apply(source, 'not-array');
    const result3 = gs.apply(source, []);

    assert.deepStrictEqual(result1, source);
    assert.deepStrictEqual(result2, source);
    assert.deepStrictEqual(result3, source);
  });

  await t.test('apply function - invalid records', () => {
    const source = { a: 1 };
    const history = [
      null,
      { type: 'unknown' },
      { type: 'delta' },
      { type: 'delta', data: { b: 2 } },
    ];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 1, b: 2 });
  });

  await t.test('apply function - empty source', () => {
    const source = {};
    const history = [{ type: 'delta', data: { a: 1, b: 2 } }];
    const result = gs.apply(source, history);

    assert.deepStrictEqual(result, { a: 1, b: 2 });
  });
});
