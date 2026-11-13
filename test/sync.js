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
