'use strict';

const { StorageProvider } = require('./provider');

class MemoryProvider extends StorageProvider {
  close(callback) {
    if (callback) callback();
  }

  create(obj, callback) {
    this.dataset.push(obj);
    if (callback) callback();
  }
}

module.exports = { MemoryProvider };
