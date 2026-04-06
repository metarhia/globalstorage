'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { SyncManager } = require('../lib/sync-browser.js');
const { runSyncManagerCoreTests } = require('./suites/sync-manager.js');

test('SyncManager (browser)', async (t) => {
  await runSyncManagerCoreTests(t, assert, async () => new SyncManager());
});
