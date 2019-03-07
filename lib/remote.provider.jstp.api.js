'use strict';

const jstp = require('@metarhia/jstp');

const { GSError, codes: errorCodes } = require('./errors');
const {
  checkPermission,
  checkPermissionComplex,
  checkExecutePermission,
  filterCategories,
} = require('./permission');

const validate = {
  string: value => typeof value === 'string',
  object: value => typeof value === 'object' && !Array.isArray(value),
  objectArray: value => Array.isArray(value) && value.every(validate.object),
  stringArray: value => Array.isArray(value) && value.every(validate.string),
};

const createPermissionChecker = (provider, accessType, userId) => (
  category,
  options,
  callback
) => {
  if (!options) options = {};
  if (options.accessType) {
    accessType = options.accessType;
  }
  const categorySchema = provider.schema.categories.get(category);
  const cb = (err, ok) => {
    if (err) {
      callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
    } else if (!ok) {
      callback(new GSError(errorCodes.INSUFFICIENT_PERMISSIONS));
    } else {
      callback();
    }
  };
  if (!categorySchema.catalog && !categorySchema.subdivision) {
    checkPermission(provider, accessType, category, userId, cb);
  } else {
    checkPermissionComplex(provider, accessType, category, userId, options, cb);
  }
};

const createCategoryFilterer = (provider, userId) => (categories, callback) => {
  filterCategories(provider, categories, userId, (err, categories) => {
    if (err) {
      callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
    } else {
      callback(null, categories);
    }
  });
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
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.get(
        id,
        (err, record) => {
          callback(err && err.code, record);
        },
        createPermissionChecker(gsProvider, 'read', userId)
      );
    },

    getDetails(connection, id, fieldName, callback) {
      if (!validate.string(id) || !validate.string(fieldName)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.getDetails(
        id,
        fieldName,
        (err, res) => {
          callback(err && err.code, res);
        },
        createPermissionChecker(gsProvider, 'read', userId)
      );
    },

    set(connection, record, callback) {
      if (!validate.object(record)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.set(
        record,
        err => {
          callback(err && err.code);
        },
        createPermissionChecker(gsProvider, 'update', userId)
      );
    },

    create(connection, category, record, callback) {
      if (!validate.string(category) || !validate.object(record)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.create(
        category,
        record,
        (err, id) => {
          callback(err && err.code, id && id.toString());
        },
        createPermissionChecker(gsProvider, 'insert', userId)
      );
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
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.update(
        category,
        query,
        patch,
        (err, count) => {
          callback(err && err.code, count);
        },
        createPermissionChecker(gsProvider, 'update', userId)
      );
    },

    linkDetails(connection, category, field, fromId, toIds, callback) {
      if (
        !validate.string(category) ||
        !validate.string(field) ||
        !validate.string(fromId) ||
        !(validate.string(toIds) || validate.stringArray(toIds))
      ) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.linkDetails(
        category,
        field,
        fromId,
        toIds,
        err => {
          callback(err && err.code);
        },
        createPermissionChecker(gsProvider, 'update', userId)
      );
    },

    unlinkDetails(connection, category, field, fromId, toIds, callback) {
      if (
        !validate.string(category) ||
        !validate.string(field) ||
        !validate.string(fromId) ||
        !(validate.string(toIds) || validate.stringArray(toIds))
      ) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.unlinkDetails(
        category,
        field,
        fromId,
        toIds,
        err => {
          callback(err && err.code);
        },
        createPermissionChecker(gsProvider, 'update', userId)
      );
    },

    delete(connection, category, query, callback) {
      if (!validate.string(category) || !validate.object(query)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.delete(
        category,
        query,
        (err, count) => {
          callback(err && err.code, count);
        },
        createPermissionChecker(gsProvider, 'delete', userId)
      );
    },

    select(connection, category, jsql, callback) {
      if (!validate.string(category) || !validate.objectArray(jsql)) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      const cursor = cursorFactory(gsProvider, category, jsql);
      cursor.fetch((err, records) => {
        callback(err && err.code, records);
      }, createPermissionChecker(gsProvider, 'read', userId));
    },

    execute(connection, category, action, args, callback) {
      if (
        (category !== null && !validate.string(category)) ||
        !validate.string(action) ||
        !validate.object(args)
      ) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const { session } = connection;
      const userId = session.get('userId');
      checkExecutePermission(
        gsProvider,
        category,
        action,
        userId,
        (err, ok) => {
          if (err) {
            callback(jstp.ERR_INTERNAL_API_ERROR);
          } else if (!ok) {
            callback(errorCodes.INSUFFICIENT_PERMISSIONS);
          } else {
            gsProvider.execute(
              category,
              action,
              [session, args],
              (err, ...res) => {
                callback(err && (err.code || err), ...res);
              }
            );
          }
        }
      );
    },

    getSchemaSources(connection, callback) {
      gsProvider.getSchemaSources(callback);
    },

    listCategories(connection, callback) {
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.listCategories((err, categories) => {
        callback(err && err.code, categories);
      }, createCategoryFilterer(gsProvider, userId));
    },
  },
  l10n: {
    getCategory(connection, langTag, category, callback) {
      gsProvider.getCategoryL10n(langTag, category, callback);
    },

    getDomains(connection, langTag, callback) {
      gsProvider.getDomainsL10n(langTag, callback);
    },

    getCommon(connection, langTag, callback) {
      gsProvider.getCommonL10n(langTag, callback);
    },

    getForm(connection, langTag, category, form, callback) {
      gsProvider.getFormL10n(langTag, category, form, callback);
    },

    getAction(connection, langTag, category, action, callback) {
      gsProvider.getActionL10n(langTag, category, action, callback);
    },
  },
});

module.exports = {
  createRemoteProviderJstpApi,
};
