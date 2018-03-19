'use strict';

const common = require('metarhia-common');

const core = require('./core');
const StorageProvider = require('./provider');

function MemoryProvider() {}

common.inherits(MemoryProvider, StorageProvider);

MemoryProvider.prototype.open = function(options, callback) {
  if (options) this.path = options.path;
  StorageProvider.prototype.open.call(this, options, callback);
};

MemoryProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  callback();
};

MemoryProvider.prototype.category = function(name) {
  return { name };
};

MemoryProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.dataset.push(obj);
  callback();
};

MemoryProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.delete = function(id, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

module.exports = MemoryProvider;
