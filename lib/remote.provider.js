'use strict';

const jstp = require('@metarhia/jstp');

const { StorageProvider } = require('./provider');
const { RemoteCursor } = require('./remote.cursor');

class RemoteProvider extends StorageProvider {
  constructor(options = {}) {
    super(options);
    this.connection = null;
  }

  // Open RemoteProvider
  //    options <Object> options for jstp connection
  //      transport <string> jstp transport name
  //      connectionArgs <Array> arguments to be passed to corresponding
  //          transport's connect method
  //    callback <Function>
  //      error <Error> | <null>
  //      provider <StorageProvider>
  open(options, callback) {
    super.open(options, error => {
      if (error) {
        callback(error, this);
        return;
      }
      jstp[options.transport].connect(
        ...options.connectionArgs,
        (error, connection) => {
          if (error) {
            callback(error);
            return;
          }
          this.connection = connection;
          this.active = true;
          callback(null, this);
        }
      );
    });
  }

  // Close RemoteProvider
  //    callback <Function>
  //      err <Error> | <null>
  close(callback) {
    if (!this.connection) {
      process.nextTick(callback);
      return;
    }
    this.connection.once('close', () => {
      this.active = false;
      callback();
    });
    this.connection.close();
    this.connection = null;
  }

  // Get record from GlobalStorage
  //   id <string> globally unique record id
  //   callback <Function>
  //     error <Error> | <null>
  //     record <Object>
  get(id, callback) {
    this.connection.callMethod('provider', 'get', [id], callback);
  }

  // Get details for many-to-many link from GlobalStorage
  //   id - <string>, globally unique object id
  //   fieldName - <string>, field with the Many decorator
  //   callback - <Function>
  //     err - <Error> | <null>
  //     details - <Object[]>
  getDetails(id, fieldName, callback) {
    this.connection.callMethod(
      'provider',
      'getDetails',
      [id, fieldName],
      callback
    );
  }

  // Set record in GlobalStorage
  //   record <Object> record to be stored
  //   callback <Function>
  //     error <Error> | <null>
  set(record, callback) {
    if (!record.Id) {
      throw new TypeError('Id is not provided');
    }
    this.connection.callMethod('provider', 'set', [record], callback);
  }

  // Create record in GlobalStorage
  //   category <string> category of record
  //   record <Object> record to be stored
  //   callback <Function>
  //     error <Error> | <null>
  //     id <string>
  create(category, record, callback) {
    this.connection.callMethod(
      'provider',
      'create',
      [category, record],
      callback
    );
  }

  // Update record in GlobalStorage
  //   category <string> category of record
  //   query <Object> record, example: { Id }
  //   patch <Object> record, fields to update
  //   callback <Function>
  //     error <Error> | <null>
  //     count <number>
  update(category, query, patch, callback) {
    this.connection.callMethod(
      'provider',
      'update',
      [category, query, patch],
      callback
    );
  }

  // Delete record in GlobalStorage
  //   category <string> category of record
  //   query <Object> record, example: { Id }
  //   callback <Function>
  //     error <Error> | <null>
  //     count <number>
  delete(category, query, callback) {
    this.connection.callMethod(
      'provider',
      'delete',
      [category, query],
      callback
    );
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
  unlinkDetails(category, field, fromId, toIds, callback) {
    this.connection.callMethod(
      'provider',
      'unlinkDetails',
      [category, field, fromId, toIds],
      callback
    );
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
  linkDetails(category, field, fromId, toIds, callback) {
    this.connection.callMethod(
      'provider',
      'linkDetails',
      [category, field, fromId, toIds],
      callback
    );
  }

  // Select record from GlobalStorage
  //   category <string> category of record
  //   query <Object> fields conditions
  // Returns: <gs.Cursor> cursor
  select(category, query) {
    return new RemoteCursor(this.connection, { category }).select(query);
  }

  // Execute an action
  //   category <string> | <null> category name or null to execute public action
  //   action <string> action name
  //   args <Object>
  //   callback <Function>
  //     error <Error> | <null>
  //     result <any>
  execute(category, action, args, callback) {
    this.connection.callMethod(
      'provider',
      'execute',
      [category, action, args],
      callback
    );
  }

  getSchemaSources(callback) {
    this.connection.callMethod('provider', 'getSchemaSources', [], callback);
  }

  listCategories(callback) {
    this.connection.callMethod('provider', 'listCategories', [], callback);
  }

  getCategoryL10n(langTag, category, callback) {
    this.connection.callMethod(
      'l10n',
      'getCategory',
      [langTag, category],
      callback
    );
  }

  getDomainsL10n(langTag, callback) {
    this.connection.callMethod('l10n', 'getDomains', [langTag], callback);
  }

  getCommonL10n(langTag, callback) {
    this.connection.callMethod('l10n', 'getCommon', [langTag], callback);
  }

  getFormL10n(langTag, category, form, callback) {
    this.connection.callMethod(
      'l10n',
      'getForm',
      [langTag, category, form],
      callback
    );
  }

  getActionL10n(langTag, category, action, callback) {
    this.connection.callMethod(
      'l10n',
      'getAction',
      [langTag, category, action],
      callback
    );
  }
}

module.exports = { RemoteProvider };
