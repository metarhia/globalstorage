'use strict';
const { join } = require('node:path');
const { mkdir, readFile, writeFile } = require('node:fs/promises');
const { fileExists } = require('metautil');
const { AbstractSearchRepository, INDEX_FILE } = require('./search-repository');

class SearchRepositoryNode extends AbstractSearchRepository {
  #path;

  constructor(basePath) {
    super();

    return this.#init(basePath);
  }

  async #init(basePath) {
    this.#path = join(basePath, 'fts');
    await mkdir(this.#path, { recursive: true });

    return this;
  }

  async load() {
    const filePath = join(this.#path, INDEX_FILE);
    const exists = await fileExists(filePath);

    return exists ? await readFile(filePath, 'utf8') : null;
  }

  async save(data) {
    const filePath = join(this.#path, INDEX_FILE);
    await writeFile(filePath, data);
  }
}

module.exports = { SearchRepositoryNode };
