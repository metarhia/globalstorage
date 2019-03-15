'use strict';

const common = require('@metarhia/common');
const jstp = require('@metarhia/jstp');
const metasync = require('metasync');

const { GSError, codes: errorCodes } = require('./errors');
const {
  checkPermission,
  checkPermissionComplex,
  checkExecutePermission,
  filterCategories,
  filterCategoriesWithPermissions,
  filterActions,
  filterApplications,
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
  if (!categorySchema.catalog && !categorySchema.subsystem) {
    checkPermission(provider, accessType, category, userId, cb);
  } else {
    checkPermissionComplex(provider, accessType, category, userId, options, cb);
  }
};

const createEntityFilterer = (provider, userId, filterEntities) => (
  entities,
  callback
) => {
  filterEntities(provider, entities, userId, (err, entities) => {
    if (err) {
      callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
    } else {
      callback(null, entities);
    }
  });
};

const constructLogContext = (connection, userId) => ({
  SystemUser: userId,
  IP: connection.remoteAddress,
  ProcessToken: common.generateGUID(),
  ConnectionId: connection.session.id,
});

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
      gsProvider.enableLogging(constructLogContext(connection, userId)).get(
        id,
        (err, record) => {
          callback(err && err.code, record);
        },
        createPermissionChecker(gsProvider, 'read', userId)
      );
    },

    getDetails(connection, category, id, fieldName, callback) {
      if (
        !validate.string(category) ||
        !validate.string(id) ||
        !validate.string(fieldName)
      ) {
        callback(jstp.ERR_INVALID_SIGNATURE);
        return;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider
        .enableLogging(constructLogContext(connection, userId))
        .getDetails(
          category,
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
      gsProvider.enableLogging(constructLogContext(connection, userId)).set(
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
      gsProvider.enableLogging(constructLogContext(connection, userId)).create(
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
      gsProvider.enableLogging(constructLogContext(connection, userId)).update(
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
      gsProvider
        .enableLogging(constructLogContext(connection, userId))
        .linkDetails(
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
      gsProvider
        .enableLogging(constructLogContext(connection, userId))
        .unlinkDetails(
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
      gsProvider.enableLogging(constructLogContext(connection, userId)).delete(
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
      const cursor = cursorFactory(gsProvider, category, jsql).enableLogging(
        gsProvider,
        constructLogContext(connection, userId),
        [category, jsql]
      );
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
      gsProvider.enableLogging(constructLogContext(connection, userId)).execute(
        category,
        action,
        [session, args],
        (err, ...res) => {
          callback(err && (err.code || err), ...res);
        },
        (category, action, callback) => {
          checkExecutePermission(
            gsProvider,
            category,
            action,
            userId,
            (err, ok) => {
              if (err) {
                callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
              } else if (!ok) {
                callback(new GSError(errorCodes.INSUFFICIENT_PERMISSIONS));
              } else {
                callback();
              }
            }
          );
        }
      );
    },

    getSchemaSources(connection, callback) {
      const userId = connection.session.get('userId');
      let ops;
      if (!userId) {
        ops = [
          (ctx, callback) => {
            gsProvider.listActions((err, actions) => {
              ctx.actionLists = { public: actions.public, private: {} };
              callback(err);
            });
          },
        ];
      } else {
        ops = [
          (ctx, callback) => {
            gsProvider.listActions((err, actions) => {
              ctx.actionLists = actions;
              callback(err);
            }, createEntityFilterer(gsProvider, userId, filterActions));
          },
          (ctx, callback) => {
            gsProvider.listCategories((err, categories) => {
              ctx.categoryList = categories;
              callback(err);
            }, createEntityFilterer(gsProvider, userId, filterCategories));
          },
          (ctx, callback) => {
            gsProvider.listApplications((err, applications) => {
              ctx.appList = applications;
              callback(err);
            }, createEntityFilterer(gsProvider, userId, filterApplications));
          },
        ];
      }
      metasync.parallel(ops, (err, options) => {
        if (err) {
          callback(err.code);
        } else {
          if (!options.categoryList) options.categoryList = [];
          if (!options.appList) options.appList = [];
          gsProvider.getSchemaSources(callback, options);
        }
      });
    },

    listCategories(connection, callback) {
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.listCategories((err, categories) => {
        callback(err && err.code, categories);
      }, createEntityFilterer(gsProvider, userId, filterCategories));
    },

    listCategoriesPermissions(connection, callback) {
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.listCategories((err, categories) => {
        callback(err && err.code, categories);
      }, createEntityFilterer(gsProvider, userId, filterCategoriesWithPermissions));
    },

    listActions(connection, callback) {
      const userId = connection.session.get('userId');
      if (!userId) {
        gsProvider.listActions((err, actions) => {
          if (err) {
            callback(err.code);
            return;
          }
          callback(null, { public: actions.public });
        });
      } else {
        gsProvider.listActions((err, actions) => {
          callback(err && err.code, actions);
        }, createEntityFilterer(gsProvider, userId, filterActions));
      }
    },

    listApplications(connection, callback) {
      const userId = connection.session.get('userId');
      if (!userId) {
        callback(errorCodes.INSUFFICIENT_PERMISSIONS);
        return;
      }
      gsProvider.listApplications((err, applications) => {
        callback(err && err.code, applications);
      }, createEntityFilterer(gsProvider, userId, filterApplications));
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
