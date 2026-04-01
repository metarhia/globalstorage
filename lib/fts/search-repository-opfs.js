'use strict';

const { AbstractSearchRepository, INDEX_FILE } = require('./search-repository');

class SearchRepositoryOPFS extends AbstractSearchRepository {
  #dirHandle;

  constructor() {
    super();

    return this.#init();
  }

  async #getFileHandle(options = {}) {
    return await this.#dirHandle.getFileHandle(INDEX_FILE, options);
  }

  async #init() {
    const OPFSHandle = await navigator.storage.getDirectory();

    this.#dirHandle = await OPFSHandle.getDirectoryHandle('fts', {
      create: true,
    });

    return this;
  }

  async load() {
    try {
      const fileHandle = await this.#getFileHandle();

      const file = await fileHandle.getFile();
      const raw = await file.text();
      return JSON.parse(raw);
    } catch (cause) {
      const message = new Error('OPFSSearchRepository::load', { cause });
      if (cause.name !== 'NotFoundError') {
        throw message;
      }
      return null;
    }
  }

  async save(data) {
    const fileHandle = await this.#getFileHandle({ create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data));
    await writable.close();
  }
}

module.exports = { SearchRepositoryOPFS };
