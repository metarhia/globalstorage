'use strict';

const common = require('metarhia-common');

const core = require('./core');

class StorageProvider {
  constructor(
    // Abstract Storage Provider
  ) {}

  open(
    // Open storage provider
    options, // object
    callback // callback function after open
  ) {
    callback = common.once(callback);
    this.options = options;
    if (options) {
      this.gs = options.gs;
      this.db = options.db;
      this.client = options.client;
    }
    callback();
  }

  close(
    // Close storage provider
    callback // callback function after close
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  generateId(
    callback // function(err, id)
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  get(
    // Get object from Global Storage
    id, // globally unique object id
    callback // function(err, obj)
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  create(
    // Create object in Global Storage
    obj, // object to be stored
    callback // function(err, id)
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  update(
    // Update object in Global Storage
    obj, // { id } object with globally unique object id
    callback // function(err)
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  delete(
    // Delete object in Global Storage
    id, // globally unique object id
    callback // function(err)
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  select(
    // Select objects from Global Storage
    query, // JSQL lambda expression
    options, // { order, limit }
    // order - order key field name
    // limit - top n records
    callback // function(err, data)
    // data - array of object
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }

  index(
    // Create index
    def, // { category, fields, unique, background }
    // category - category name
    // fields - array of field names
    // unique - bool flag, default false
    // background - bool flag, default true
    callback // function(err)
  ) {
    callback = common.once(callback);
    callback(new Error(core.NOT_IMPLEMENTED));
  }
}

module.exports = { StorageProvider };
