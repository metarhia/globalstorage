'use strict';

const test = require('node:test');
const assert = require('node:assert');

const globalStorage = require('..');

const { diff, merge, apply, materialize } = globalStorage;
const { assign, increment, latestTime, isDelta } = globalStorage;

const stamp = (time, replica = 'a') => ({ time, replica });

const permutations = (list) => {
  const count = list.length;
  if (count <= 1) return [list];
  const rows = new Array(count).fill(null);
  for (let i = 0; i < count; i++) {
    const head = list.slice(0, i);
    const tail = list.slice(i + 1);
    rows[i] = permutations(head.concat(tail));
  }
  const width = rows[0].length;
  const result = new Array(count * width).fill(null);
  for (let i = 0; i < count; i++) {
    const row = rows[i];
    const item = list[i];
    for (let j = 0; j < width; j++) {
      result[i * width + j] = [item].concat(row[j]);
    }
  }
  return result;
};

test('CRDT diff', async (t) => {
  await t.test('basic object diff', () => {
    assert.deepStrictEqual(diff({}, {}), {});
    const source = { a: 1, b: 2, c: 3 };
    const target = { a: 1, b: 20, d: 4 };
    assert.deepStrictEqual(diff(source, target), { b: 20, c: undefined, d: 4 });
  });

  await t.test('new keys added', () => {
    const result = diff({ a: 1 }, { a: 1, b: 2, c: 3 });
    assert.deepStrictEqual(result, { b: 2, c: 3 });
  });

  await t.test('keys removed', () => {
    const result = diff({ a: 1, b: 2, c: 3 }, { a: 1 });
    assert.deepStrictEqual(result, { b: undefined, c: undefined });
  });

  await t.test('arrays and sets', () => {
    const arrays = diff({ items: [1, 2, 3] }, { items: [1, 2, 3, 4, 5] });
    assert.deepStrictEqual(arrays, { items: [4, 5] });
    const source = { tags: new Set(['a', 'b']) };
    const target = { tags: new Set(['a', 'b', 'c']) };
    assert.deepStrictEqual(diff(source, target), { tags: ['c'] });
  });

  await t.test('nested objects', () => {
    const source = { user: { name: 'John', age: 30 } };
    const target = { user: { name: 'Jane', age: 30, city: 'NYC' } };
    const result = diff(source, target);
    assert.deepStrictEqual(result, { user: { name: 'Jane', city: 'NYC' } });
  });

  await t.test('newer registers only', () => {
    const old = assign({ name: 'Ada' }, stamp(1));
    const fresh = assign({ name: 'Grace' }, stamp(2));
    assert.deepStrictEqual(diff(old, fresh), fresh);
    assert.deepStrictEqual(diff(fresh, old), {});
  });

  await t.test('counter entries above source', () => {
    const source = { likes: { $counter: { inc: { a: 2, b: 1 }, dec: {} } } };
    const target = { likes: { $counter: { inc: { a: 2, b: 3 }, dec: {} } } };
    const result = diff(source, target);
    const expected = { likes: { $counter: { inc: { b: 3 }, dec: {} } } };
    assert.deepStrictEqual(result, expected);
    assert.deepStrictEqual(diff(target, source), {});
  });

  await t.test('merging the diff reaches the target', () => {
    const source = merge(assign({ name: 'Ada' }, stamp(1)), {
      likes: { $counter: { inc: { a: 1 } } },
    });
    const target = merge(source, {
      name: { $lww: { value: 'Grace', time: 2, replica: 'b' } },
      likes: { $counter: { inc: { b: 4 } } },
    });
    const delta = diff(source, target);
    assert.deepStrictEqual(merge(source, delta), target);
  });
});

test('CRDT merge', async (t) => {
  await t.test('plain values follow merge patch', () => {
    const result = merge({ a: 1, b: 2 }, { b: 20, c: 3 });
    assert.deepStrictEqual(result, { a: 1, b: 20, c: 3 });
  });

  await t.test('delete keys', () => {
    const result = merge({ a: 1, b: 2, c: 3 }, { b: undefined });
    assert.deepStrictEqual(result, { a: 1, c: 3 });
  });

  await t.test('arrays and sets merge as union', () => {
    const result = merge({ items: [1, 2, 3] }, { items: [3, 4, 5] });
    assert.deepStrictEqual(result, { items: [1, 2, 3, 4, 5] });
  });

  await t.test('nested objects', () => {
    const source = { user: { name: 'John', age: 30 } };
    const result = merge(source, { user: { age: 31, city: 'NYC' } });
    const expected = { user: { name: 'John', age: 31, city: 'NYC' } };
    assert.deepStrictEqual(result, expected);
  });

  await t.test('null and undefined delta', () => {
    const source = { a: 1, b: 2 };
    assert.strictEqual(merge(source, null), source);
    assert.strictEqual(merge(source, undefined), source);
  });

  await t.test('null source', () => {
    assert.deepStrictEqual(merge(null, { a: 1, b: 2 }), { a: 1, b: 2 });
  });

  await t.test('inputs are not changed', () => {
    const source = { a: 1, nested: { b: 2 } };
    const delta = { nested: { c: 3 } };
    merge(source, delta);
    assert.deepStrictEqual(source, { a: 1, nested: { b: 2 } });
    assert.deepStrictEqual(delta, { nested: { c: 3 } });
  });

  await t.test('unchanged state is returned as is', () => {
    const state = merge({}, assign({ name: 'Ada', age: 30 }, stamp(5)));
    assert.strictEqual(merge(state, assign({ name: 'Old' }, stamp(4))), state);
    assert.strictEqual(merge(state, state), state);
    assert.notStrictEqual(merge(state, assign({ age: 31 }, stamp(6))), state);
  });

  await t.test('register keeps the latest write', () => {
    const first = assign({ name: 'Ada' }, stamp(1));
    const second = assign({ name: 'Grace' }, stamp(2));
    const forward = materialize(merge(merge({}, first), second));
    const backward = materialize(merge(merge({}, second), first));
    assert.deepStrictEqual(forward, { name: 'Grace' });
    assert.deepStrictEqual(backward, { name: 'Grace' });
  });

  await t.test('equal times are ordered by replica id', () => {
    const left = assign({ name: 'Ada' }, stamp(1, 'a'));
    const right = assign({ name: 'Grace' }, stamp(1, 'b'));
    const forward = materialize(merge(left, right));
    const backward = materialize(merge(right, left));
    assert.deepStrictEqual(forward, backward);
    assert.deepStrictEqual(forward, { name: 'Grace' });
  });

  await t.test('plain value does not replace a register', () => {
    const state = assign({ name: 'Ada' }, stamp(1));
    assert.strictEqual(merge(state, { name: 'Plain' }), state);
  });

  await t.test('counter takes per-replica maximum', () => {
    const state = { likes: { $counter: { inc: { a: 2 }, dec: { a: 1 } } } };
    const delta = { likes: { $counter: { inc: { a: 1, b: 3 } } } };
    const result = merge(state, delta);
    const expected = { inc: { a: 2, b: 3 }, dec: { a: 1 } };
    assert.deepStrictEqual(result.likes.$counter, expected);
    assert.strictEqual(materialize(result).likes, 4);
  });

  await t.test('join is idempotent, commutative and associative', () => {
    const deltas = [
      assign({ name: 'Ada', age: 30 }, stamp(1, 'a')),
      assign({ age: 31 }, stamp(2, 'b')),
      increment({}, ['likes'], 1, 'a'),
      increment({}, ['likes'], 2, 'b'),
      { tags: ['x', 'y'] },
      { tags: ['y', 'z'] },
      { address: assign({ city: 'Kyiv' }, stamp(3, 'c')) },
    ];
    const expected = materialize(apply({}, deltas));
    for (const order of permutations(deltas.slice(0, 5))) {
      const sequence = order.concat(deltas.slice(5));
      const twice = sequence.concat(sequence);
      assert.deepStrictEqual(materialize(apply({}, sequence)), expected);
      assert.deepStrictEqual(materialize(apply({}, twice)), expected);
    }
    const grouped = merge(merge({}, deltas[0]), merge(deltas[1], deltas[2]));
    const chained = merge(merge(merge({}, deltas[0]), deltas[1]), deltas[2]);
    assert.deepStrictEqual(grouped, chained);
  });
});

test('CRDT apply and materialize', async (t) => {
  await t.test('apply merges deltas in order', () => {
    const source = { a: 1, b: 2 };
    const result = apply(source, [{ b: 20 }, { c: 3 }, null, { a: 6 }]);
    assert.deepStrictEqual(result, { a: 6, b: 20, c: 3 });
  });

  await t.test('apply with invalid history', () => {
    const source = { a: 1 };
    assert.strictEqual(apply(source, null), source);
    assert.strictEqual(apply(source, 'not-array'), source);
    assert.strictEqual(apply(source, []), source);
  });

  await t.test('materialize registers, counters and tombstones', () => {
    const state = apply({}, [
      assign({ name: 'Ada', email: 'ada@example.com' }, stamp(1)),
      assign({ email: null }, stamp(2)),
      increment({}, ['stats', 'likes'], 3, 'a'),
      increment({}, ['stats', 'likes'], -1, 'b'),
      { tags: ['x'] },
    ]);
    const expected = { name: 'Ada', stats: { likes: 2 }, tags: ['x'] };
    assert.deepStrictEqual(materialize(state), expected);
  });

  await t.test('latest time of all registers', () => {
    const state = merge(assign({ a: 1 }, stamp(5)), {
      nested: assign({ b: 2 }, stamp(9)),
    });
    assert.strictEqual(latestTime(state), 9);
    assert.strictEqual(latestTime({}), 0);
  });
});

test('CRDT mutators', async (t) => {
  await t.test('assign copies values into registers', () => {
    const profile = { city: 'Kyiv' };
    const delta = assign({ profile, skip: undefined }, stamp(7, 'r1'));
    profile.city = 'Lviv';
    const register = { value: { city: 'Kyiv' }, time: 7, replica: 'r1' };
    assert.deepStrictEqual(delta, { profile: { $lww: register } });
  });

  await t.test('increment raises own entry from current state', () => {
    let state = {};
    state = merge(state, increment(state, ['reactions', 'like'], 1, 'a'));
    state = merge(state, increment(state, ['reactions', 'like'], 1, 'a'));
    const delta = increment(state, ['reactions', 'like'], 1, 'a');
    const expected = { $counter: { inc: { a: 3 }, dec: {} } };
    assert.deepStrictEqual(delta, { reactions: { like: expected } });
    state = merge(state, delta);
    state = merge(state, delta);
    assert.deepStrictEqual(materialize(state), { reactions: { like: 3 } });
  });
});

test('CRDT delta validation', async (t) => {
  await t.test('accepts CRDT values', () => {
    const delta = merge(assign({ name: 'Ada', meta: { a: [1] } }, stamp(1)), {
      tags: ['x', 1, true],
      stats: increment({}, ['likes'], 2, 'a'),
    });
    assert.strictEqual(isDelta(delta), true);
    assert.strictEqual(isDelta({}), true);
  });

  await t.test('rejects plain values and malformed tags', () => {
    const register = (value) => ({ $lww: value });
    const invalid = [
      null,
      [],
      { name: 'plain' },
      { name: register({ value: 1, time: 'now', replica: 'a' }) },
      { name: register({ value: 1, time: 1 }) },
      { name: { ...register({ value: 1, time: 1, replica: 'a' }), x: 1 } },
      { likes: { $counter: { inc: { a: -1 } } } },
      { likes: { $counter: { inc: { a: 1.5 } } } },
      { likes: { $counter: { inc: [] } } },
      { tags: [{ nested: true }] },
      JSON.parse('{"__proto__":{"tags":["x"]}}'),
      { name: register({ value: new Date(), time: 1, replica: 'a' }) },
    ];
    for (const delta of invalid) assert.strictEqual(isDelta(delta), false);
  });
});
