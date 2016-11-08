'use strict';

module.exports = StorageProvider;

// Abstract Storage Provider
//
function StorageProvider() {
}

var NOT_IMPLEMENTED = 'Not implemented in abstract interface';

// Open storage provider
//   options
//   callback - after open
//
StorageProvider.prototype.open = function(options, callback) {
  this.options = options;
  if (options) {
    this.connection = options.connection;
    this.gs = options.gs;
  }
  callback();
};

// Close storage provider
//   callback - after close
//
StorageProvider.prototype.close = function(callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Get object from Global Storage
//   objectId - globally unique object id
//   callback - function(err, object)
//
StorageProvider.prototype.get = function(objectId, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Create object in Global Storage
//   object - object to be stored
//   callback - function(err, objectId)
//
StorageProvider.prototype.create = function(object, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Update object in Global Storage
//   object - object to be updated
//   object.id - globally unique object id
//   callback - function(err)
//
StorageProvider.prototype.update = function(object, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Delete object in Global Storage
//   objectId - globally unique object id
//   callback - function(err)
//
StorageProvider.prototype.delete = function(objectId, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Find objects in Global Storage
//   query - JSQL lambda expression
//   //projection - to be applied after query (not implemented)
//   callback - function(err, data)
//
StorageProvider.prototype.find = function(query, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};
