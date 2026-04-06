'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const createTemp = async () => {
  const id = Math.random().toString(36).slice(2, 11);
  const tmpRoot = os.tmpdir();
  const dirName = `gs-test-${Date.now()}-${id}`;
  const tempDir = path.join(tmpRoot, dirName);
  const mkdirOptions = { recursive: true };
  await fs.mkdir(tempDir, mkdirOptions);
  return tempDir;
};

const cleanupTemp = async (dir) => {
  const rmOptions = { recursive: true, force: true };
  try {
    await fs.rm(dir, rmOptions);
  } catch {
    // ignore missing or already removed paths
  }
};

module.exports = { createTemp, cleanupTemp };
