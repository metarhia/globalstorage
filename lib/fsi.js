'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { fileExists } = require('metautil');

const read = (dir, filename) => fs.readFile(path.join(dir, filename), 'utf8');

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
  const filePath = path.join(dir, filename);
  if (await fileExists(filePath)) await fs.unlink(filePath);
};

const list = (dir) =>
  fs.readdir(dir).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });

const fsi = { read, write, exists, remove, list };

module.exports = { fsi };
