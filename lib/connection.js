'use strict';

const common = require('metarhia-common');

function Connection(options) {
  Connection.super_.call(this);
  this.gs = null;
  this.name = options.name;
}

Connection.prototype.open = function(callback) {
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

module.exports = gs => {
  common.inherits(Connection, gs.StorageProvider);
  gs.Connection = Connection;
};
