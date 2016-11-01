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
  StorageProvider.call(this, options);
  this.path = options.path;
};

FsProvider.prototype.open = function(callback) {
  callback();
};

FsProvider.prototype.close = function(callback) {
  callback();
};

FsProvider.prototype.get = function(objectId, callback) {
  callback();
};

FsProvider.prototype.create = function(object, callback) {
  callback();
};

FsProvider.prototype.update = function(object, callback) {
  callback();
};

FsProvider.prototype.delete = function(objectId, callback) {
  callback();
};

FsProvider.prototype.find = function(query, callback) {
  callback();
};
