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
  //   callback - <Function>
  //     err - <Error> | <null>
  //     provider - <StorageProvider>
  // eslint-disable-next-line no-unused-vars
  open(options, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Close StorageProvider
  //   callback - <Function>
  //     err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  close(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Generate globally unique id
  //   callback - <Function>
  //     err - <Error> | <null>
  //     id - <string>
  // eslint-disable-next-line no-unused-vars
  takeId(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get object from GlobalStorage
  //   id - <string>, globally unique object id
  //   callback - <Function>
  //     err - <Error> | <null>
  //     obj - <Object>
  // eslint-disable-next-line no-unused-vars
  get(id, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get details for many-to-many link from GlobalStorage
  //   id - <string>, globally unique object id
  //   fieldName - <string>, field with the Many decorator
  //   callback - <Function>
  //     err - <Error> | <null>
  //     details - <Object[]>
  // eslint-disable-next-line no-unused-vars
  getDetails(id, fieldName, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  //   obj - <Object>, to be stored
  //   callback - <Function>
  //     err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  set(obj, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  //   category - <string>, category to store the object in
  //   obj - <Object>, to be stored
  //   callback - <Function>
  //     err - <Error> | <null>
  //     id - <string>
  // eslint-disable-next-line no-unused-vars
  create(category, obj, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  //   category - <string>, category to update the records in
  //   query - <Object>, example: { Id }
  //   patch - <Object>, fields to update
  //   callback - <Function>
  //     err - <Error> | <null>
  //     count - <number>
  // eslint-disable-next-line no-unused-vars
  update(category, query, patch, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  //   category - <string>, category to delete the records from
  //   query - <Object>, example: { Id }
  //   callback - <Function>
  //     err - <Error> | <null>
  //     count - <number>
  // eslint-disable-next-line no-unused-vars
  delete(category, query, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Link records with Many relation between them
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  //   callback - <Function>
  //     err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  linkDetails(category, field, fromId, toIds, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Unlink records with Many relation between them
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  //   callback - <Function>
  //     err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  unlinkDetails(category, field, fromId, toIds, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  //   category - <string>, category to select the records from
  //   query - <Object>, fields conditions
  //
  // Returns: <Cursor>
  // eslint-disable-next-line no-unused-vars
  select(category, query) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }
}

module.exports = { StorageProvider };
