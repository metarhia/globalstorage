'use strict';

module.exports = MemoryProvider;
var util = require('util');
var StorageProvider = require('./provider.js');
util.inherits(MemoryProvider, StorageProvider);
var fs = require('fs');

// File System Storage Provider
//   options.path - base path
//
function MemoryProvider() {
}

MemoryProvider.prototype.open = function(options, callback) {
  if (options) {
    this.path = options.path;
  }
  StorageProvider.prototype.open.call(this, options, callback);
};

MemoryProvider.prototype.close = function(callback) {
  callback();
};

MemoryProvider.prototype.category = function(name) {
  return {};
};

MemoryProvider.prototype.generateId = function(callback) {
  callback();
};

MemoryProvider.prototype.get = function(id, callback) {
  callback();
};

MemoryProvider.prototype.create = function(obj, callback) {
  callback();
};

MemoryProvider.prototype.update = function(obj, callback) {
  callback();
};

MemoryProvider.prototype.delete = function(id, callback) {
  callback();
};

MemoryProvider.prototype.find = function(query, callback) {
  callback();
};
