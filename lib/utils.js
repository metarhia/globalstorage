'use strict';

const fs = require('node:fs/promises');

const toBool = [() => true, () => false];

const exists = async (path) => {
  const stats = await fs.stat(path).catch(() => null);
  return !!stats;
};

const ensureDirectory = async (path) => {
  const alreadyExists = await exists(path);
  if (alreadyExists) return true;
  return fs.mkdir(path).then(...toBool);
};

module.exports = { exists, ensureDirectory, toBool };
