'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const createTempDir = async () => {
  const id = Math.random().toString(36).substr(2, 9);
  const tempDir = path.join(os.tmpdir(), `gs-test-${Date.now()}-${id}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
};

const cleanupTempDir = async (dir) => {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
};

module.exports = { createTempDir, cleanupTempDir };
