'use strict';

module.exports = (api) => {

  api.gs.MemoryProvider = MemoryProvider;
  api.util.inherits(MemoryProvider, api.gs.StorageProvider);

  function MemoryProvider() {}

  MemoryProvider.prototype.open = function(options, callback) {
    if (options) this.path = options.path;
    api.gs.StorageProvider.prototype.open.call(this, options, callback);
  };

  MemoryProvider.prototype.close = function(callback) {
    callback = api.common.cb(callback);
    callback();
  };

  MemoryProvider.prototype.category = function(name) {
    return { name };
  };

  MemoryProvider.prototype.generateId = function(callback) {
    callback = api.common.cb(callback);
    callback(new Error(api.gs.NOT_IMPLEMENTED));
  };

  MemoryProvider.prototype.get = function(id, callback) {
    callback = api.common.cb(callback);
    callback(new Error(api.gs.NOT_IMPLEMENTED));
  };

  MemoryProvider.prototype.create = function(obj, callback) {
    callback = api.common.cb(callback);
    this.dataset.push(obj);
    callback();
  };

  MemoryProvider.prototype.update = function(obj, callback) {
    callback = api.common.cb(callback);
    callback(new Error(api.gs.NOT_IMPLEMENTED));
  };

  MemoryProvider.prototype.delete = function(id, callback) {
    callback = api.common.cb(callback);
    callback(new Error(api.gs.NOT_IMPLEMENTED));
  };

  MemoryProvider.prototype.index = function(def, callback) {
    callback = api.common.cb(callback);
    callback(new Error(api.gs.NOT_IMPLEMENTED));
  };

};
