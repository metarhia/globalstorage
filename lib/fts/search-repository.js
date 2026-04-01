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
   * @returns {Promise<object|null>} - the promise of the loading result
   */
  async load() {
    throw new TypeError(`${this.constructor.name}.load is not implemented`);
  }
  /**
   *
   * @param {object} data
   * @returns {Promise<void>}
   */
  async save() {
    throw new TypeError(`${this.constructor.name}.save is not implemented`);
  }
}

module.exports = { AbstractSearchRepository, INDEX_FILE };
