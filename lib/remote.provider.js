'use strict';

const jstp = require('@metarhia/jstp');

const { StorageProvider } = require('./provider');
const { RemoteCursor } = require('./remote.cursor');

class RemoteProvider extends StorageProvider {
  constructor(gs) {
    super(gs);
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
    jstp[options.transport].connect(
      ...options.connectionArgs,
      (error, connection) => {
        if (error) {
          callback(error);
          return;
        }
        this.connection = connection;
        callback(null, this);
      }
    );
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

  // Select record from GlobalStorage
  //   category <string> category of record
  //   query <Object> fields conditions
  // Returns: <gs.Cursor> cursor
  select(category, query) {
    return new RemoteCursor(this.connection, { category }).select(query);
  }


  // Execute Action
  //   category - <string>, name of a category that the action is defined upon
  //   name - <string>, name of an Action to execute
  //   args - <Object>, object that contains arguments of an action
  //   callback - <Function>
  //     error - <Error>
  //     message - <string>
  execute(connection, category, name, args, callback) {
    this.connection.callMethod(
      'provider',
      'execute',
      [category, name, args],
      callback
    );
  }
}

module.exports = { RemoteProvider };
