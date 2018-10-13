'use strict';

const common = require('metarhia-common');

const { StorageProvider } = require('./provider');

class MemoryProvider extends StorageProvider {
  close(callback) {
    callback = common.once(callback);
    callback();
  }

  create(obj, callback) {
    callback = common.once(callback);
    this.dataset.push(obj);
    callback();
  }
}

module.exports = { MemoryProvider };
