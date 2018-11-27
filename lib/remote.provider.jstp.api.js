'use strict';

const jstp = require('@metarhia/jstp');

const validate = {
  string: value => typeof value === 'string',
  object: value => typeof value === 'object' && !Array.isArray(value),
  objectArray: value => Array.isArray(value) && value.every(validate.object),
};

// Create JSTP API that can be passed to JSTP application
//   gsProvider <StorageProvider> JSTP calls will be passed to this provider,
//                                it must be already in an `open` state
//   cursorFactory <Function> factory to be used to create new cursors
//     gsProvider <StorageProvider> provider instance to create the cursor from
//     category <string> category name to be passed to the cursor
//     jsql <Object[]> jsql to be passed to the cursor
//   Returns: <Cursor> created cursor
// Returns: <Object> JSTP API
const createRemoteProviderJstpApi = (gsProvider, cursorFactory) => ({
  provider: {
    get(connection, id, callback) {
      if (!validate.string(id)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      gsProvider.get(id, (err, record) => {
        callback(err && err.code, record);
      });
    },

    set(connection, record, callback) {
      if (!validate.object(record)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      gsProvider.set(record, err => {
        callback(err && err.code);
      });
    },

    create(connection, category, record, callback) {
      if (!validate.string(category) || !validate.object(record)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      gsProvider.create(category, record, (err, id) => {
        callback(err && err.code, id && id.toString());
      });
    },

    update(connection, category, query, patch, callback) {
      if (
        !validate.string(category) ||
        !validate.object(query) ||
        !validate.object(patch)
      ) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      gsProvider.update(category, query, patch, (err, count) => {
        callback(err && err.code, count);
      });
    },

    delete(connection, category, query, callback) {
      if (!validate.string(category) || !validate.object(query)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      gsProvider.delete(category, query, (err, count) => {
        callback(err && err.code, count);
      });
    },

    select(connection, category, jsql, callback) {
      if (!validate.string(category) || !validate.objectArray(jsql)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const cursor = cursorFactory(gsProvider, category, jsql);
      cursor.fetch((err, records) => {
        callback(err && err.code, records);
      });
    },

    execute(connection, category, name, args, callback) {
      if (
        !validate.string(category) ||
        !validate.string(name) ||
        !validate.object(args)
      ) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      gsProvider.execute(category,
        name,
        connection.session,
        args,
        (err, message) => {
          callback(err && err.code, message);
        }
      );
    },
  },
});

module.exports = {
  createRemoteProviderJstpApi,
};
