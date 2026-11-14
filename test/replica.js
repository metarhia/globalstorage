'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Replica, emitError } = require('..');
const { useTemp } = require('./utils/temp.js');
const { message, values } = require('./utils/records.js');

const like = (replica, id) => replica.increment('message', id, ['likes']);

test('Replica: own changes are applied and logged', async () => {
  const replica = new Replica();
  const events = [];
  replica.on('log', (event) => events.push(event));
  const created = message(replica, 'm1', 'hello');
  like(replica, 'm1');
  like(replica, 'm1');
  assert.deepStrictEqual(replica.get('m1'), {
    content: 'hello',
    username: 'ada',
    likes: 2,
  });
  assert.strictEqual(replica.position, 3);
  assert.strictEqual(replica.size, 1);
  assert.strictEqual(events.length, 3);
  assert.deepStrictEqual(events[0], {
    deltas: [created],
    position: 1,
    origin: '',
  });
  assert.strictEqual(created.entity, 'message');
  assert.strictEqual(created.target, 'm1');
  assert.strictEqual(replica.get('m2'), null);
});

test('Replica: repeated and stale deltas are not logged', async () => {
  const source = new Replica();
  const target = new Replica();
  message(source, 'm1', 'old');
  message(source, 'm1', 'new');
  like(source, 'm1');
  const { deltas } = source.since(0);
  assert.strictEqual(target.merge(deltas, 'peer').length, 3);
  assert.deepStrictEqual(target.merge(deltas, 'peer'), []);
  const replay = target.merge([deltas[0]], 'peer');
  assert.deepStrictEqual(replay, []);
  assert.strictEqual(target.position, 3);
  assert.strictEqual(target.origin(0), 'peer');
  assert.strictEqual(target.origin(9), '');
  assert.deepStrictEqual(values(target), values(source));
});

test('Replica: replicas converge in any delivery order', async () => {
  const a = new Replica();
  const b = new Replica();
  message(a, 'm1', 'from a');
  like(a, 'm1');
  message(b, 'm1', 'from b');
  like(b, 'm1');
  like(b, 'm1');
  const fromA = a.since(0).deltas;
  const fromB = b.since(0).deltas;
  const forward = new Replica();
  forward.merge(fromA.concat(fromB));
  const backward = new Replica();
  backward.merge(fromB.toReversed().concat(fromA.toReversed()));
  a.merge(fromB);
  b.merge(fromA);
  const expected = values(forward);
  assert.deepStrictEqual(values(backward), expected);
  assert.deepStrictEqual(values(a), expected);
  assert.deepStrictEqual(values(b), expected);
  assert.strictEqual(expected.m1.likes, 3);
});

test('Replica: own write after a seen write wins', async () => {
  const replica = new Replica();
  const future = Date.now() + 60000;
  const register = { value: 'remote', time: future, replica: 'other' };
  const data = { content: { $lww: register } };
  replica.merge([{ id: 'd1', entity: 'message', target: 'm1', data }]);
  message(replica, 'm1', 'local');
  assert.strictEqual(replica.get('m1').content, 'local');
  const { time } = replica.state('m1').content.$lww;
  assert.ok(time > future);
});

test('Replica: invalid deltas are rejected', async () => {
  const validate = (delta) => delta.entity === 'message';
  const replica = new Replica({ validate });
  const data = { likes: { $counter: { inc: { a: 1 } } } };
  const invalid = [
    null,
    { id: '', entity: 'message', target: 'm1', data },
    { id: 'd1', entity: 'message', target: 'm1', data: { likes: 1 } },
    { id: 'd2', entity: 'user', target: 'u1', data },
    { id: 'd3', entity: 1, target: 'm1', data },
  ];
  assert.deepStrictEqual(replica.merge(invalid), []);
  assert.deepStrictEqual(replica.merge('not array'), []);
  assert.strictEqual(replica.assign('user', 'u1', { name: 'ada' }), null);
  const delta = { id: 'd4', entity: 'message', target: 'm1', data, x: 1 };
  const fresh = replica.merge([delta]);
  assert.deepStrictEqual(fresh, [
    { id: 'd4', entity: 'message', target: 'm1', data },
  ]);
});

test('Replica: since returns log slices', async () => {
  const replica = new Replica();
  for (let i = 0; i < 5; i++) message(replica, `m${i}`, `text ${i}`);
  const first = replica.since(0, 2);
  assert.strictEqual(first.deltas.length, 2);
  assert.strictEqual(first.position, 2);
  const rest = replica.since(first.position);
  assert.strictEqual(rest.deltas.length, 3);
  assert.strictEqual(rest.position, 5);
  assert.deepStrictEqual(replica.since(10), { deltas: [], position: 5 });
  assert.strictEqual(replica.since(-1).position, 5);
});

test('Replica: links keep cursors', async () => {
  const replica = new Replica();
  assert.deepStrictEqual(replica.getLink('server'), {
    source: '',
    pulled: 0,
    pushed: 0,
  });
  replica.setLink('server', { source: 's1', pulled: 4, pushed: -1 });
  const link = replica.getLink('server');
  assert.deepStrictEqual(link, { source: 's1', pulled: 4, pushed: 0 });
  link.pulled = 10;
  assert.strictEqual(replica.getLink('server').pulled, 4);
});

test('Replica: persistent replica restores log, state and links', async (t) => {
  const dir = await useTemp(t);
  const replica = await new Replica({ path: dir }).open();
  const count = 300;
  for (let i = 0; i < count; i++) message(replica, `m${i}`, `text ${i}`);
  like(replica, 'm1');
  replica.setLink('server', { source: 's1', pulled: 7, pushed: 301 });
  await replica.save();
  const files = await fs.readdir(path.join(dir, 'log'));
  assert.deepStrictEqual(files.toSorted(), ['0.json', '1.json']);

  const restored = await new Replica({ path: dir }).open();
  assert.strictEqual(restored.id, replica.id);
  assert.strictEqual(restored.position, count + 1);
  assert.deepStrictEqual(restored.get('m1'), replica.get('m1'));
  assert.deepStrictEqual(restored.since(0), replica.since(0));
  assert.deepStrictEqual(restored.getLink('server'), {
    source: 's1',
    pulled: 7,
    pushed: 301,
  });
});

test('Replica: changes before open are refused', async (t) => {
  const dir = await useTemp(t);
  const replica = new Replica({ path: dir });
  assert.throws(() => message(replica, 'm1', 'hi'), /not open/);
  assert.strictEqual(await replica.open(), replica);
  assert.strictEqual(replica.open(), replica.open());
  message(replica, 'm1', 'hi');
  assert.strictEqual(replica.position, 1);
});

test('Replica: lost log tail gives a new identity', async (t) => {
  const dir = await useTemp(t);
  const replica = await new Replica({ path: dir }).open();
  for (let i = 0; i < 260; i++) message(replica, `m${i}`, 'x');
  replica.setLink('server', { source: 's1', pulled: 3, pushed: 3 });
  await replica.save();
  await fs.rm(path.join(dir, 'log', '1.json'));
  const restored = await new Replica({ path: dir }).open();
  assert.notStrictEqual(restored.id, replica.id);
  assert.strictEqual(restored.position, 256);
  assert.deepStrictEqual(restored.getLink('server').source, '');
});

test('Replica: clear removes data and changes identity', async (t) => {
  const dir = await useTemp(t);
  const replica = await new Replica({ path: dir }).open();
  message(replica, 'm1', 'hello');
  await replica.save();
  const { id } = replica;
  let cleared = 0;
  replica.on('clear', () => cleared++);
  const clearing = replica.clear();
  message(replica, 'm2', 'during clear');
  await clearing;
  assert.strictEqual(cleared, 1);
  assert.notStrictEqual(replica.id, id);
  assert.strictEqual(replica.get('m1'), null);
  const restored = await new Replica({ path: dir }).open();
  assert.strictEqual(restored.id, replica.id);
  assert.strictEqual(restored.position, 1);
  assert.strictEqual(restored.get('m2').content, 'during clear');
});

test('Replica: cursor changes are saved lazily', async (t) => {
  const dir = await useTemp(t);
  const replica = await new Replica({ path: dir }).open();
  await replica.save();
  const readLinks = async () => {
    const raw = await fs.readFile(path.join(dir, 'meta.json'), 'utf8');
    return JSON.parse(raw).links;
  };
  replica.setLink('server', { source: 's1', pulled: 2, pushed: 0 });
  await new Promise((resolve) => {
    setImmediate(resolve);
  });
  assert.deepStrictEqual(await readLinks(), {});
  await replica.save();
  const link = { source: 's1', pulled: 2, pushed: 0 };
  assert.deepStrictEqual(await readLinks(), { server: link });
});

test('emitError: reports only to listeners', () => {
  const replica = new Replica();
  const error = new Error('boom');
  assert.doesNotThrow(() => emitError(replica, error));
  const errors = [];
  replica.on('error', (reported) => errors.push(reported));
  emitError(replica, error);
  assert.deepStrictEqual(errors, [error]);
});

test('Replica: keys of one entity', async (t) => {
  const dir = await useTemp(t);
  const replica = await new Replica({ path: dir }).open();
  replica.assign('chat', 'c1', { name: 'general' });
  message(replica, 'm1', 'hello');
  message(replica, 'm2', 'again');
  replica.assign('message', 'c1', { content: 'other entity' });
  assert.deepStrictEqual([...replica.keys('chat')], ['c1']);
  assert.deepStrictEqual([...replica.keys('message')], ['m1', 'm2']);
  assert.deepStrictEqual([...replica.keys('user')], []);
  assert.deepStrictEqual([...replica.keys()], ['c1', 'm1', 'm2']);
  await replica.save();
  const restored = await new Replica({ path: dir }).open();
  assert.deepStrictEqual([...restored.keys('chat')], ['c1']);
  await restored.clear();
  assert.deepStrictEqual([...restored.keys('message')], []);
});
