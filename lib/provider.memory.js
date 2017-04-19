'use strict';

module.exports = (api) => {

  api.gs.MemoryProvider = MemoryProvider;
  api.util.inherits(MemoryProvider, api.gs.StorageProvider);

  function MemoryProvider() {}

  MemoryProvider.prototype.open = function(options, callback) {
    if (options) {
      this.path = options.path;
    }
    api.gs.StorageProvider.prototype.open.call(this, options, callback);
  };

  MemoryProvider.prototype.close = function(callback) {
    if (callback) callback();
  };

  MemoryProvider.prototype.category = function(name) {
    return { name };
  };

  MemoryProvider.prototype.generateId = function(callback) {
    callback();
  };

  MemoryProvider.prototype.get = function(id, callback) {
    callback();
  };

  MemoryProvider.prototype.create = function(obj, callback) {
    this.dataset.push(obj);
    if (callback) callback();
  };

  MemoryProvider.prototype.update = function(obj, callback) {
    if (callback) callback();
  };

  MemoryProvider.prototype.delete = function(id, callback) {
    if (callback) callback();
  };

  MemoryProvider.prototype.index = function(def, callback) {
    if (callback) callback();
  };

};
