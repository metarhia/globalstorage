'use strict';

const common = require('metarhia-common');

const core = require('./core');
const { StorageProvider } = require('./provider');

class MemoryProvider extends StorageProvider {
  close(callback) {
    callback = common.once(callback);
    callback();
  }

  generateId(callback) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  get(id, callback) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  create(obj, callback) {
    callback = common.once(callback);
    this.dataset.push(obj);
    callback();
  }

  update(obj, callback) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  delete(id, callback) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  index(def, callback) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }
}

module.exports = { MemoryProvider };
