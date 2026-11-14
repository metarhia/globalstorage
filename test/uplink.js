'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { Emitter } = require('metautil');
const { Replica, SyncService, Uplink } = require('..');
const { Connection, tick, until } = require('./utils/metacom.js');
const { useTemp } = require('./utils/temp.js');
const { message, values } = require('./utils/records.js');

const createServer = (replica = new Replica()) => {
  const service = new SyncService(replica);
  const units = { sync: service.api };
  return { replica, service, units };
};

const connect = (server, replica = new Replica(), name = 'server') => {
  const connection = new Connection(server.units);
  const uplink = new Uplink(replica, connection, { name });
  uplink.start();
  connection.open();
  return { replica, connection, uplink };
};

const pushed = (connection) =>
  connection.calls
    .filter((call) => call.method === 'sync/push')
    .flatMap((call) => call.args.deltas);

test('Uplink: replicas sync through a service', async () => {
  const server = createServer();
  const a = connect(server);
  const b = connect(server);
  message(a.replica, 'm1', 'from a');
  message(b.replica, 'm2', 'from b');
  b.replica.increment('message', 'm1', ['likes']);
  await until(() => a.replica.position === 3 && b.replica.position === 3);
  assert.deepStrictEqual(values(a.replica), values(server.replica));
  assert.deepStrictEqual(values(b.replica), values(server.replica));
  assert.deepStrictEqual(server.replica.get('m1'), {
    content: 'from a',
    username: 'ada',
    likes: 1,
  });
});

test('Uplink: offline changes are pushed after reconnect', async () => {
  const server = createServer();
  const a = connect(server);
  const b = connect(server);
  await until(() => b.uplink.link.source === server.replica.id);
  b.connection.close();
  message(a.replica, 'm1', 'online');
  message(b.replica, 'm2', 'offline');
  await until(() => server.replica.position === 1);
  await tick();
  assert.strictEqual(b.replica.get('m1'), null);
  b.connection.open();
  await until(() => b.replica.position === 2 && a.replica.position === 2);
  assert.deepStrictEqual(values(b.replica), values(a.replica));
});

test('Uplink: deltas from the uplink are not pushed back', async () => {
  const server = createServer();
  for (let i = 0; i < 5; i++) message(server.replica, `s${i}`, 'server');
  const client = connect(server);
  await until(() => client.replica.position === 5);
  const own = message(client.replica, 'c1', 'client');
  await until(() => server.replica.position === 6);
  await client.uplink.flush();
  assert.deepStrictEqual(pushed(client.connection), [own]);
  assert.strictEqual(client.uplink.link.pushed, 6);
});

test('Uplink: missed events make it pull', async () => {
  const server = createServer();
  const a = connect(server);
  const b = connect(server);
  await until(() => b.uplink.link.source === server.replica.id);
  b.connection.isDropping = true;
  message(a.replica, 'm1', 'one');
  message(a.replica, 'm2', 'two');
  await until(() => server.replica.position === 2);
  await tick();
  b.connection.isDropping = false;
  message(a.replica, 'm3', 'three');
  await until(() => b.replica.position === 3);
  assert.deepStrictEqual(values(b.replica), values(server.replica));
});

test('Uplink: long logs are pulled in pages', async () => {
  const server = createServer();
  for (let i = 0; i < 600; i++) message(server.replica, `m${i}`, 'text');
  const client = connect(server);
  await until(() => client.replica.position === 600);
  const pulls = client.connection.calls.filter(
    (call) => call.method === 'sync/pull',
  );
  assert.strictEqual(pulls.length, 3);
  assert.strictEqual(client.uplink.link.pulled, 600);
});

test('Uplink: replaced uplink gets all data again', async () => {
  const first = createServer();
  const client = connect(first);
  message(client.replica, 'm1', 'kept by client');
  await until(() => first.replica.position === 1);
  message(first.replica, 'm2', 'from first server');
  await until(() => client.replica.position === 2);
  client.connection.close();
  const second = createServer();
  const connection = new Connection(second.units);
  const uplink = new Uplink(client.replica, connection, { name: 'server' });
  uplink.start();
  connection.open();
  await until(() => second.replica.position === 2);
  assert.deepStrictEqual(values(second.replica), values(client.replica));
});

test('Uplink: stored cursors continue after restart', async (t) => {
  const dir = await useTemp(t);
  const server = createServer();
  for (let i = 0; i < 10; i++) message(server.replica, `m${i}`, 'text');
  const replica = await new Replica({ path: dir }).open();
  const first = connect(server, replica);
  await until(() => replica.position === 10);
  first.uplink.stop();
  first.connection.close();
  await replica.save();
  message(server.replica, 'm10', 'new');
  const restored = await new Replica({ path: dir }).open();
  const second = connect(server, restored);
  await until(() => restored.position === 11);
  const pulls = second.connection.calls.filter(
    (call) => call.method === 'sync/pull',
  );
  assert.deepStrictEqual(pulls[0].args, {
    source: server.replica.id,
    position: 10,
  });
  assert.deepStrictEqual(pushed(second.connection), []);
});

test('Uplink: cleared replica pulls everything again', async () => {
  const server = createServer();
  message(server.replica, 'm1', 'hello');
  const client = connect(server);
  await until(() => client.replica.position === 1);
  await client.replica.clear();
  assert.strictEqual(client.uplink.link.source, '');
  message(server.replica, 'm2', 'next');
  await until(() => client.replica.position === 2);
  assert.deepStrictEqual(values(client.replica), values(server.replica));
});

test('Uplink: stop removes listeners', async () => {
  const server = createServer();
  const client = connect(server);
  await until(() => client.uplink.link.source === server.replica.id);
  client.uplink.stop();
  message(server.replica, 'm1', 'not received');
  message(client.replica, 'm2', 'not sent');
  await tick();
  await tick();
  assert.strictEqual(client.replica.get('m1'), null);
  assert.strictEqual(server.replica.get('m2'), null);
});

// Client of a metacom host: events it receives and its close event
class Subscriber extends Emitter {
  events = [];

  emit(name, data) {
    if (name === 'close') return super.emit(name, data);
    this.events.push({ name, data });
    return Promise.resolve();
  }
}

test('SyncService: events go to subscribed clients', async () => {
  const replica = new Replica();
  const service = new SyncService(replica, { unit: 'chat' });
  const client = new Subscriber();
  const other = new Subscriber();
  assert.strictEqual(await service.api.subscribe({}, { client }), true);
  assert.strictEqual(await service.api.subscribe({}, { client }), true);
  assert.strictEqual(await service.api.subscribe({}, {}), false);
  const delta = message(replica, 'm1', 'hello');
  const data = { source: replica.id, deltas: [delta], position: 1 };
  assert.deepStrictEqual(client.events, [{ name: 'chat/log', data }]);
  assert.ok(Object.isFrozen(client.events[0].data));
  assert.deepStrictEqual(other.events, []);
  client.emit('close');
  message(replica, 'm2', 'after close');
  assert.strictEqual(client.events.length, 1);
  await service.api.subscribe({}, { client: other });
  service.close();
  message(replica, 'm3', 'after service close');
  assert.deepStrictEqual(other.events, []);
});

test('SyncService: pull and push contract', async () => {
  const replica = new Replica();
  const service = new SyncService(replica, { name: 'tab' });
  message(replica, 'm1', 'hello');
  const foreign = await service.api.pull({ source: 'other', position: 1 });
  assert.strictEqual(foreign.source, replica.id);
  assert.strictEqual(foreign.deltas.length, 1);
  assert.strictEqual(foreign.more, false);
  const known = await service.api.pull({ source: replica.id, position: 1 });
  assert.deepStrictEqual(known.deltas, []);
  const other = new Replica();
  const delta = message(other, 'm2', 'pushed');
  const reply = await service.api.push({ deltas: [delta, delta] });
  assert.deepStrictEqual(reply, {
    source: replica.id,
    position: 2,
    applied: 1,
  });
  assert.strictEqual(replica.origin(1), 'tab');
  await assert.rejects(service.api.push({ deltas: 'x' }), { code: 400 });
  const many = new Array(2000).fill(delta);
  await assert.rejects(service.api.push({ deltas: many }), { code: 400 });
});

test('Uplink: following uplink clears with it', async () => {
  const server = createServer();
  message(server.replica, 'm1', 'hello');
  const replica = new Replica();
  const connection = new Connection(server.units);
  const options = { name: 'server', clear: 'follow' };
  const uplink = new Uplink(replica, connection, options);
  uplink.start();
  connection.open();
  await until(() => replica.position === 1);
  let cleared = 0;
  replica.on('clear', () => cleared++);
  await server.replica.clear();
  await until(() => cleared === 1);
  await until(() => uplink.link.source === server.replica.id);
  await uplink.flush();
  assert.strictEqual(replica.size, 0);
  assert.strictEqual(server.replica.size, 0);
});

test('Uplink: cleared uplink gets data back by default', async () => {
  const server = createServer();
  message(server.replica, 'm1', 'hello');
  const client = connect(server);
  await until(() => client.replica.position === 1);
  await server.replica.clear();
  await until(() => server.replica.get('m1') !== null);
  assert.strictEqual(client.replica.size, 1);
});
