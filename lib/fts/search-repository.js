'use strict';

const INDEX_FILE = 'fts-index.json';

class AbstractSearchRepository {
  constructor() {
    if (new.target === AbstractSearchRepository) {
      throw new Error(
        'AbstractSearchRepository' +
          'is an abstract class and cannot be instantiated directly',
      );
    }
    // async operations to initialize a file system (Node.js or a Browser)
  }
  /**
   *
   * @returns {Promise<string|null>} - the promise of the loading result
   */
  async load() {
    throw new TypeError(`"${this.load}" method is not implemented`);
  }
  /**
   *
   * @param {string} data
   * @returns {Promise<void>}
   */
  async save() {
    throw new TypeError(`"${this.save}" method is not implemented`);
  }
}

module.exports = { AbstractSearchRepository, INDEX_FILE };
