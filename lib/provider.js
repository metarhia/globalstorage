'use strict';

const errors = require('./errors');

// Abstract Storage Provider
class StorageProvider {
  // Create StorageProvider
  //   gs - globalstorage instance
  constructor(gs) {
    this.gs = gs;
  }

  // Open StorageProvider
  //   callback - function(err, StorageProvider)
  // eslint-disable-next-line no-unused-vars
  open(options, callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Close StorageProvider
  //   callback - function(err)
  // eslint-disable-next-line no-unused-vars
  close(callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Generate globally unique id
  //   callback - function(err, id)
  // eslint-disable-next-line no-unused-vars
  takeId(callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Get object from GlobalStorage
  //   id - globally unique object id
  //   callback - function(err, obj)
  // eslint-disable-next-line no-unused-vars
  get(id, callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err)
  // eslint-disable-next-line no-unused-vars
  set(obj, callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err, id)
  // eslint-disable-next-line no-unused-vars
  create(obj, callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  //   query - object, example: { Id }
  //   patch - object, fields to update
  //   callback - function(err, count)
  // eslint-disable-next-line no-unused-vars
  update(query, patch, callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  //   query - object, example: { Id }
  //   callback - function(err, count)
  // eslint-disable-next-line no-unused-vars
  delete(query, callback) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  //   query - fields conditions
  // Returns: Cursor
  // eslint-disable-next-line no-unused-vars
  select(query) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }
}

module.exports = { StorageProvider };
