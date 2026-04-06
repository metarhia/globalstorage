'use strict';

const test = require('node:test');
const { installMockOpfs } = require('./utils/mock-opfs.js');
const { runFsiTests } = require('./suites/fsi.js');

test('fsi-browser module (OPFS mock)', async (t) => {
  const opfs = installMockOpfs();
  t.after(() => opfs.uninstall());

  const fsiBrowser = require('../lib/fsi-browser.js');

  await runFsiTests(t, fsiBrowser, {
    getRoot: async () =>
      `vfs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    joinPath: (root, ...parts) => [root, ...parts].join('/'),
  });
});
