'use strict';

const { GSError, codes: errorCodes } = require('./errors');

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
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Close StorageProvider
  //   callback - function(err)
  // eslint-disable-next-line no-unused-vars
  close(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Generate globally unique id
  //   callback - function(err, id)
  // eslint-disable-next-line no-unused-vars
  takeId(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get object from GlobalStorage
  //   id - globally unique object id
  //   callback - function(err, obj)
  // eslint-disable-next-line no-unused-vars
  get(id, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err)
  // eslint-disable-next-line no-unused-vars
  set(obj, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  //   category - string, category to store the object in
  //   obj - object to be stored
  //   callback - function(err, id)
  // eslint-disable-next-line no-unused-vars
  create(category, obj, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  //   category - string, category to update the records in
  //   query - object, example: { Id }
  //   patch - object, fields to update
  //   callback - function(err, count)
  // eslint-disable-next-line no-unused-vars
  update(category, query, patch, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  //   category - string, category to delete the records from
  //   query - object, example: { Id }
  //   callback - function(err, count)
  // eslint-disable-next-line no-unused-vars
  delete(category, query, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  //   category - string, category to select the records from
  //   query - fields conditions
  // Returns: Cursor
  // eslint-disable-next-line no-unused-vars
  select(category, query) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }
}

module.exports = { StorageProvider };
