'use strict';

const test = require('node:test');
const assert = require('node:assert');
const globalStorage = require('..');
const { useTemp } = require('./utils/temp.js');
const { runSyncManagerCoreTests } = require('./suites/sync-manager.js');

test('SyncManager', async (t) => {
  await runSyncManagerCoreTests(t, assert, async (t2) => {
    const tempDir = await useTemp(t2);
    const storage = await globalStorage.open({ path: tempDir });
    return storage.sync;
  });
});

test('SyncManager persists nodes', async (t) => {
  const { SyncManager } = require('../lib/sync.js');
  const tempDir = await useTemp(t);
  const url = 'ws://peer.example.com:8001';

  const sync1 = await new SyncManager(tempDir);
  await sync1.addNode({ url, type: 'uplink' });

  const sync2 = await new SyncManager(tempDir);
  assert.deepStrictEqual(
    sync2.listNodes().map((node) => node.url),
    [url],
  );
  await sync2.removeNode(url);

  const sync3 = await new SyncManager(tempDir);
  assert.strictEqual(sync3.listNodes().length, 0);
});
