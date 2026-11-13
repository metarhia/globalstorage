'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const createTemp = () => fs.mkdtemp(path.join(os.tmpdir(), 'gs-test-'));

const cleanupTemp = async (dir) => {
  const rmOptions = { recursive: true, force: true };
  try {
    await fs.rm(dir, rmOptions);
  } catch {
    // ignore missing or already removed paths
  }
};

const useTemp = async (t) => {
  const dir = await createTemp();
  t.after(() => cleanupTemp(dir));
  return dir;
};

module.exports = { createTemp, cleanupTemp, useTemp };
