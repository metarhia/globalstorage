'use strict';

const test = require('node:test');
const { installMockIdb } = require('./utils/mock-idb.js');
const { runFsiTests } = require('./suites/fsi.js');

test('fsi-idb module (IndexedDB mock)', async (t) => {
  const idb = installMockIdb();
  t.after(() => idb.uninstall());

  const fsiIdb = require('../lib/fsi-idb.js');

  await runFsiTests(t, fsiIdb, {
    getRoot: async () =>
      `idb-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    joinPath: (root, ...parts) => [root, ...parts].join('/'),
  });
});
