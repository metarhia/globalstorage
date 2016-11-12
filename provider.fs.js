'use strict';

module.exports = FsProvider;
var util = require('util');
var StorageProvider = require('./provider.js');
util.inherits(FsProvider, StorageProvider);
var fs = require('fs');

// File System Storage Provider
//   options.path - base path
//
function FsProvider(options) {
}

FsProvider.prototype.open = function(options, callback) {
  this.path = options.path;
  StorageProvider.prototype.open.call(this, options, callback);
};

FsProvider.prototype.close = function(callback) {
  callback();
};

FsProvider.prototype.category = function(name) {
  return {};
};

FsProvider.prototype.generateId = function(callback) {
  callback();
};

FsProvider.prototype.get = function(id, callback) {
  callback();
};

FsProvider.prototype.create = function(obj, callback) {
  callback();
};

FsProvider.prototype.update = function(obj, callback) {
  callback();
};

FsProvider.prototype.delete = function(id, callback) {
  callback();
};

FsProvider.prototype.find = function(query, options, callback) {
  callback();
};

FsProvider.prototype.index = function(def, callback) {
  callback();
};
