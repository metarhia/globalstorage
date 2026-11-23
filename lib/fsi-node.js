'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const { fileExists } = require('metautil');

const ifMissing = (error, value) => {
  if (error.code === 'ENOENT') return value;
  throw error;
};

const read = async (dir, filename) => {
  const filePath = path.join(dir, filename);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    return ifMissing(error, null);
  }
};

const write = async (dir, filename, content) => {
  const filePath = path.join(dir, filename);
  try {
    await fs.writeFile(filePath, content);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content);
  }
};

const exists = (dir, filename) => fileExists(path.join(dir, filename));

const remove = async (dir, filename) => {
  try {
    await fs.unlink(path.join(dir, filename));
  } catch (error) {
    ifMissing(error, undefined);
  }
};

const list = async (dir) => {
  try {
    return await fs.readdir(dir);
  } catch (error) {
    return ifMissing(error, []);
  }
};

const fsi = { read, write, exists, remove, list };

module.exports = { fsi };
