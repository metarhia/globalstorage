'use strict';

const common = require('metarhia-common');

const core = require('./core');

// Abstract Storage Provider
class StorageProvider {
  // Create StorageProvider
  //   gs - globalstorage instance
  constructor(gs) {
    this.gs = gs;
  }

  // Open StorageProvider
  //   callback - function(err, StorageProvider)
  open(options, callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Close StorageProvider
  //   callback - function(err)
  close(callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Generate globally unique id
  //   callback - function(err, id)
  takeId(callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Get object from GlobalStorage
  //   id - globally unique object id
  //   callback - function(err, obj)
  get(id, callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err)
  set(obj, callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err, id)
  create(obj, callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  //   query - object, example: { Id }
  //   patch - object, fields to update
  //   callback - function(err, count)
  update(query, patch, callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  //   query - object, example: { Id }
  //   callback - function(err, count)
  delete(query, callback) {
    throw new Error(core.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  //   query - fields conditions
  // Returns: Cursor
  select(query) {
    throw new Error(core.NOT_IMPLEMENTED);
  }
}

module.exports = { StorageProvider };
