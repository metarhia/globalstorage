'use strict';

module.exports = (api) => {

  api.gs.StorageProvider = StorageProvider;

  // Abstract Storage Provider
  //
  function StorageProvider() {
  }

  const NOT_IMPLEMENTED = 'Not implemented';

  StorageProvider.prototype.open = function(
    // Open storage provider
    options, // object
    callback // callback function after open
  ) {
    this.options = options;
    if (options) {
      this.connection = options.connection;
      this.gs = options.gs;
    }
    if (callback) callback();
  };

  StorageProvider.prototype.close = function(
    // Close storage provider
    callback // callback function after close
  ) {
    if (callback) callback(new Error(NOT_IMPLEMENTED));
  };

  StorageProvider.prototype.category = function(
    // Create category to access objects in it
    name // category name
    // Return: Category instance
  ) {
    return { name };
  };

  StorageProvider.prototype.generateId = function(
    callback // function(err, id)
  ) {
    if (callback) callback();
  };

  StorageProvider.prototype.get = function(
    // Get object from Global Storage
    id, // globally unique object id
    callback // function(err, obj)
  ) {
    callback(new Error(NOT_IMPLEMENTED));
  };

  StorageProvider.prototype.create = function(
    // Create object in Global Storage
    obj, // object to be stored
    callback // function(err, id)
  ) {
    if (callback) callback(new Error(NOT_IMPLEMENTED));
  };

  StorageProvider.prototype.update = function(
    // Update object in Global Storage
    obj, // { id } object with globally unique object id
    callback // function(err)
  ) {
    if (callback) callback(new Error(NOT_IMPLEMENTED));
  };

  StorageProvider.prototype.delete = function(
    // Delete object in Global Storage
    id, // globally unique object id
    callback // function(err)
  ) {
    if (callback) callback(new Error(NOT_IMPLEMENTED));
  };

  StorageProvider.prototype.select = function(
    // Select objects from Global Storage
    query, // JSQL lambda expression
    options, // { order, limit }
    // order - order key field name
    // limit - top n records
    callback // function(err, data)
    // data - array of object
  ) {
    if (callback) callback(new Error(NOT_IMPLEMENTED));
  };

  StorageProvider.prototype.index = function(
    // Create index
    def, // { category, fields, unique, background }
    // category - category name
    // fields - array of field names
    // unique - bool flag, default false
    // background - bool flag, default true
    callback // function(err)
  ) {
    if (callback) callback(new Error(NOT_IMPLEMENTED));
  };

};
