'use strict';

const api = {};
api.util = require('util');

module.exports = Connection;
const StorageProvider = require('./provider.js');
api.util.inherits(Connection, StorageProvider);

// Global Storage Connection
//
function Connection(options) {
  StorageProvider.call(this, options);
  this.gs = null;
  this.name = options.name;
}

Connection.prototype.open = function(callback) {
  //StorageProvider.super_.prototype.close.apply(this, callback);
  callback();
};

Connection.prototype.close = function(callback) {
  if (this.gs) {
    delete this.gs.connections[this.name];
  }
  callback();
};

Connection.prototype.get = function(objectId, callback) {
  callback();
};

Connection.prototype.create = function(object, callback) {
  callback();
};

Connection.prototype.update = function(object, callback) {
  callback();
};

Connection.prototype.delete = function(objectId, callback) {
  callback();
};

Connection.prototype.find = function(query, callback) {
  callback();
};
