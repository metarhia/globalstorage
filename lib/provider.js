'use strict';

module.exports = StorageProvider;

// Abstract Storage Provider
//
function StorageProvider() {
}

var NOT_IMPLEMENTED = 'Not implemented';

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

// Create category to access objects in it
//   name - category name
//   return - category instance
//
StorageProvider.prototype.category = function(name) {
  return {};
};

// Generate object id
//
StorageProvider.prototype.generateId = function(callback) {
  callback();
};

// Get object from Global Storage
//   id - globally unique object id
//   callback - function(err, obj)
//
StorageProvider.prototype.get = function(id, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Create object in Global Storage
//   obj - object to be stored
//   callback - function(err, id)
//
StorageProvider.prototype.create = function(obj, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Update object in Global Storage
//   obj - object to be updated
//   obj.id - globally unique object id
//   callback - function(err)
//
StorageProvider.prototype.update = function(obj, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Delete object in Global Storage
//   id - globally unique object id
//   callback - function(err)
//
StorageProvider.prototype.delete = function(id, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Select objects from Global Storage
//   query - JSQL lambda expression
//   options.order - order key field name
//   options.limit - top n records
//   callback - function(err, data)
//     data - array of object
//
StorageProvider.prototype.select = function(query, options, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};

// Create index
//   def.category - category name
//   def.fields - array of field names
//   def.unique - bool flag, default false
//   def.background - bool flag, default true
//   callback - function(err)
//
StorageProvider.prototype.index = function(def, callback) {
  callback(new Error(NOT_IMPLEMENTED));
};
