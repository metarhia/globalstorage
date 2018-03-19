'use strict';

const common = require('metarhia-common');

const StorageProvider = require('./provider');

function Connection(options) {
  StorageProvider.call(this, options);
  this.gs = null;
  this.name = options.name;
}

common.inherits(Connection, StorageProvider);

Connection.prototype.open = function(callback) {
  // StorageProvider.super_.prototype.close.apply(this, callback);
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

module.exports = Connection;
