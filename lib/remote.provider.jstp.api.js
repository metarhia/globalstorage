'use strict';

const common = require('@metarhia/common');
const jstp = require('@metarhia/jstp');

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

const createPermissionChecker = (provider, accessType, userId) => async (
  category,
  options
) => {
  if (!options) options = {};
  if (options.accessType) {
    accessType = options.accessType;
  }
  const categorySchema = provider.schema.categories.get(category);
  let ok;
  try {
    if (!categorySchema.catalog && !categorySchema.subsystem) {
      ok = await checkPermission(provider, accessType, category, userId);
    } else {
      ok = await checkPermissionComplex(
        provider,
        accessType,
        category,
        userId,
        options
      );
    }
  } catch (err) {
    throw new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err);
  }
  if (!ok) {
    throw new GSError(errorCodes.INSUFFICIENT_PERMISSIONS);
  }
};

const createEntityFilterer = (
  provider,
  userId,
  filterEntities
) => async entities => {
  try {
    return await filterEntities(provider, entities, userId);
  } catch (err) {
    throw new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err);
  }
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
    async get(connection, id) {
      if (!validate.string(id)) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .get(id, createPermissionChecker(gsProvider, 'read', userId));
      } catch (err) {
        throw err.code;
      }
    },

    async getDetails(connection, category, id, fieldName) {
      if (
        !validate.string(category) ||
        !validate.string(id) ||
        !validate.string(fieldName)
      ) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .getDetails(
            category,
            id,
            fieldName,
            createPermissionChecker(gsProvider, 'read', userId)
          );
      } catch (err) {
        throw err.code;
      }
    },

    async set(connection, record) {
      if (!validate.object(record)) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .set(record, createPermissionChecker(gsProvider, 'update', userId));
      } catch (err) {
        throw err.code;
      }
    },

    async create(connection, category, record) {
      if (!validate.string(category) || !validate.object(record)) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        const id = await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .create(
            category,
            record,
            createPermissionChecker(gsProvider, 'insert', userId)
          );
        return id.toString();
      } catch (err) {
        throw err.code;
      }
    },

    async update(connection, category, query, patch) {
      if (
        !validate.string(category) ||
        !validate.object(query) ||
        !validate.object(patch)
      ) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .update(
            category,
            query,
            patch,
            createPermissionChecker(gsProvider, 'update', userId)
          );
      } catch (err) {
        throw err.code;
      }
    },

    async linkDetails(connection, category, field, fromId, toIds) {
      if (
        !validate.string(category) ||
        !validate.string(field) ||
        !validate.string(fromId) ||
        !(validate.string(toIds) || validate.stringArray(toIds))
      ) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .linkDetails(
            category,
            field,
            fromId,
            toIds,
            createPermissionChecker(gsProvider, 'update', userId)
          );
      } catch (err) {
        throw err.code;
      }
    },

    async unlinkDetails(connection, category, field, fromId, toIds) {
      if (
        !validate.string(category) ||
        !validate.string(field) ||
        !validate.string(fromId) ||
        !(validate.string(toIds) || validate.stringArray(toIds))
      ) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .unlinkDetails(
            category,
            field,
            fromId,
            toIds,
            createPermissionChecker(gsProvider, 'update', userId)
          );
      } catch (err) {
        throw err.code;
      }
    },

    async delete(connection, category, query) {
      if (!validate.string(category) || !validate.object(query)) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .delete(
            category,
            query,
            createPermissionChecker(gsProvider, 'delete', userId)
          );
      } catch (err) {
        throw err.code;
      }
    },

    async select(connection, category, jsql) {
      if (!validate.string(category) || !validate.objectArray(jsql)) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      const cursor = cursorFactory(gsProvider, category, jsql).enableLogging(
        gsProvider,
        constructLogContext(connection, userId),
        [category, jsql]
      );
      try {
        return await cursor.fetch(
          createPermissionChecker(gsProvider, 'read', userId)
        );
      } catch (err) {
        throw err.code;
      }
    },

    async execute(connection, category, action, args) {
      if (
        (category !== null && !validate.string(category)) ||
        !validate.string(action) ||
        !validate.object(args)
      ) {
        throw jstp.ERR_INVALID_SIGNATURE;
      }
      const { session } = connection;
      const userId = session.get('userId');
      try {
        return await gsProvider
          .enableLogging(constructLogContext(connection, userId))
          .execute(
            category,
            action,
            [session, args],
            async (category, action) => {
              let ok;
              try {
                ok = await checkExecutePermission(
                  gsProvider,
                  category,
                  action,
                  userId
                );
              } catch (err) {
                throw new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err);
              }
              if (!ok) {
                throw new GSError(errorCodes.INSUFFICIENT_PERMISSIONS);
              }
            }
          );
      } catch (err) {
        if (err.code) throw err.code;
        throw err;
      }
    },

    async getSchemaSources(connection) {
      const userId = connection.session.get('userId');
      const opt = { categoryList: [], appList: [] };
      try {
        if (!userId) {
          const actions = await gsProvider.listActions();
          opt.actionLists = { public: actions.public, private: {} };
        } else {
          [opt.actionLists, opt.categoryList, opt.appList] = await Promise.all([
            gsProvider.listActions(
              createEntityFilterer(gsProvider, userId, filterActions)
            ),
            gsProvider.listCategories(
              createEntityFilterer(gsProvider, userId, filterCategories)
            ),
            gsProvider.listApplications(
              createEntityFilterer(gsProvider, userId, filterApplications)
            ),
          ]);
        }
      } catch (err) {
        throw err.code;
      }
      return gsProvider.getSchemaSources(opt);
    },

    async listCategories(connection) {
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider.listCategories(
          createEntityFilterer(gsProvider, userId, filterCategories)
        );
      } catch (err) {
        throw err.code;
      }
    },

    async listCategoriesPermissions(connection) {
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider.listCategories(
          createEntityFilterer(
            gsProvider,
            userId,
            filterCategoriesWithPermissions
          )
        );
      } catch (err) {
        throw err.code;
      }
    },

    async listActions(connection) {
      const userId = connection.session.get('userId');
      try {
        if (!userId) {
          const actions = await gsProvider.listActions();
          return { public: actions.public };
        } else {
          return await gsProvider.listActions(
            createEntityFilterer(gsProvider, userId, filterActions)
          );
        }
      } catch (err) {
        throw err.code;
      }
    },

    async listApplications(connection) {
      const userId = connection.session.get('userId');
      if (!userId) {
        throw errorCodes.INSUFFICIENT_PERMISSIONS;
      }
      try {
        return await gsProvider.listApplications(
          createEntityFilterer(gsProvider, userId, filterApplications)
        );
      } catch (err) {
        throw err.code;
      }
    },
  },
  l10n: {
    async getCategory(connection, langTag, category) {
      return gsProvider.getCategoryL10n(langTag, category);
    },

    async getDomains(connection, langTag) {
      return gsProvider.getDomainsL10n(langTag);
    },

    async getCommon(connection, langTag) {
      return gsProvider.getCommonL10n(langTag);
    },

    async getForm(connection, langTag, category, form) {
      return gsProvider.getFormL10n(langTag, category, form);
    },

    async getAction(connection, langTag, category, action) {
      return gsProvider.getActionL10n(langTag, category, action);
    },
  },
});

module.exports = {
  createRemoteProviderJstpApi,
};
