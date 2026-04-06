'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { fileExists } = require('metautil');

const read = (dir, filename) => fs.readFile(path.join(dir, filename), 'utf8');

const write = async (dir, filename, content) => {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), content);
};

const exists = (dir, filename) => fileExists(path.join(dir, filename));

const remove = async (dir, filename) => {
  const filePath = path.join(dir, filename);
  if (await fileExists(filePath)) await fs.unlink(filePath);
};

module.exports = { read, write, exists, remove };
