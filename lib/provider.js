'use strict';

const { Uint64, iter } = require('@metarhia/common');

const { GSError, codes: errorCodes } = require('./errors');
const {
  createRemoteProviderJstpApi,
} = require('./remote.provider.jstp.api.js');
const { runIfFn } = require('./utils');
const { prepareForLogging } = require('./log');

const requireLogging = new Set([
  'get',
  'getDetails',
  'set',
  'create',
  'update',
  'delete',
  'linkDetails',
  'unlinkDetails',
  'select',
  'execute',
]);

const opToUserAccess = {
  get: 'Read',
  getDetails: 'Read',
  set: 'Update',
  create: 'Insert',
  update: 'Update',
  delete: 'Delete',
  linkDetails: 'Update',
  unlinkDetails: 'Update',
  select: 'Read',
  execute: null,
};

const fillLogData = {
  get(args, dest) {
    dest.Identifier = args[0];
  },
  getDetails(args, dest) {
    dest.Category = args[0];
    dest.Identifier = args[1];
    dest.Query = { getDetails: args[2] };
  },
  set(args, dest) {
    dest.Identifier = args[0].Id;
    dest.Patch = args[0];
  },
  create(args, dest) {
    dest.Category = args[0];
    dest.Query = args[1];
  },
  update(args, dest) {
    dest.Category = args[0];
    dest.Query = args[1];
    dest.Patch = args[2];
  },
  delete(args, dest) {
    dest.Category = args[0];
    dest.Query = args[1];
  },
  linkDetails(args, dest) {
    dest.Category = args[0];
    dest.Query = { linkDetails: args[1], from: args[2], to: args[3] };
  },
  unlinkDetails(args, dest) {
    dest.Category = args[0];
    dest.Query = { unlinkDetails: args[1], from: args[2], to: args[3] };
  },
  select(args, dest) {
    dest.Category = args[0];
    dest.Query = args[1];
  },
  execute(args, dest) {
    dest.Category = args[0];
    dest.Action = args[1];
    dest.Query = args[2][1];
  },
};

const originalProvider = Symbol('originalProvider');

// Abstract Storage Provider
class StorageProvider {
  // Create StorageProvider
  //   options <Object>
  //     serverSuffix <Uint64> optional
  //     serverBitmask <Uint64> optional
  //     systemSuffix <Uint64> optional
  //     systemBitmas <Uint64> optional
  constructor({
    serverSuffix = new Uint64(0),
    serverBitmask = new Uint64(0xffffff),
    systemSuffix = null,
    systemBitmask = null,
    systemLogger = (...args) => console.error(...args),
  }) {
    this.active = false;
    this.cursorFactory = null;
    this.schema = null;
    this.systemLogger = systemLogger;
    this.serverSuffix = serverSuffix;
    this.serverBitmask = serverBitmask;
    this.systemSuffix = systemSuffix;
    this.systemBitmask = systemBitmask;
    this.serverBitmaskSize = this.serverBitmask.toString(2).length;
  }

  // Open StorageProvider
  //   options - <Object>
  //     schema - <Metaschema>
  //   callback - <Function>
  //     err - <Error> | <null>
  //     provider - <StorageProvider>
  open({ schema }, callback) {
    this.schema = schema;
    callback();
  }

  // Close StorageProvider
  //   callback - <Function>
  //     err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  close(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Setup StorageProvider
  //   callback - <Function>
  //     options - <Object>
  //     err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  setup(options, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  enableLogging(ctx) {
    return new Proxy(this, {
      get(provider, prop, proxy) {
        if (prop === originalProvider) return provider;
        if (typeof provider[prop] !== 'function' || !requireLogging.has(prop)) {
          return provider[prop];
        }
        if (prop === 'select') {
          return (...args) => {
            provider.log('select', args, ctx);
            return provider.select
              .call(proxy, ...args)
              .enableLogging(proxy, ctx, args);
          };
        }
        return (...args) => {
          let callback, permissionChecker;
          if (args.length === provider[prop].length) {
            permissionChecker = args.pop();
            callback = args.pop();
          } else {
            callback = args.pop();
          }
          provider.log(prop, args, ctx);
          provider[prop].call(
            proxy,
            ...args,
            (err, ...result) => {
              provider.log(prop, args, ctx, err || result);
              callback(err, ...result);
            },
            permissionChecker
          );
        };
      },
    });
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
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  get(id, callback, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get details for many-to-many link from GlobalStorage
  //   category - <string>, category to get details in
  //   id - <string>, object id
  //   fieldName - <string>, field with the Many decorator
  //   callback - <Function>
  //     err - <Error> | <null>
  //     details - <Object[]>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  getDetails(category, id, fieldName, callback, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  //   obj - <Object>, to be stored
  //   callback - <Function>
  //     err - <Error> | <null>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  set(obj, callback, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  //   category - <string>, category to store the object in
  //   obj - <Object>, to be stored
  //   callback - <Function>
  //     err - <Error> | <null>
  //     id - <string>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  create(category, obj, callback, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  //   category - <string>, category to update the records in
  //   query - <Object>, example: { Id }
  //   patch - <Object>, fields to update
  //   callback - <Function>
  //     err - <Error> | <null>
  //     count - <number>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  update(category, query, patch, callback, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  //   category - <string>, category to delete the records from
  //   query - <Object>, example: { Id }
  //   callback - <Function>
  //     err - <Error> | <null>
  //     count - <number>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  delete(category, query, callback, permissionChecker) {
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
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  linkDetails(category, field, fromId, toIds, callback, permissionChecker) {
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
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  // eslint-disable-next-line no-unused-vars
  unlinkDetails(category, field, fromId, toIds, callback, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  //   category - <string>, category to select the records from
  //   query - <Object>, fields conditions
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  //
  // Returns: <Cursor>
  // eslint-disable-next-line no-unused-vars
  select(category, query, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Execute an action
  //   category <string> | <null> category name or null to execute public action
  //   action <string> action name
  //   actionArgs <Array>
  //     session <jstp.Session>
  //     args <Object>
  //   callback <Function>
  //     error <Error> | <null>
  //     result <any>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     action - <string>
  //     callback - <Function>
  //       err - <Error> | <null>
  execute(category, action, actionArgs, callback, permissionChecker) {
    runIfFn(permissionChecker, category, action, err => {
      if (err) {
        callback(err);
        return;
      }

      let foundAction;
      if (category === null) {
        foundAction = this.schema.actions.get(action);
      } else {
        const categorySchema = this.schema.categories.get(category);
        if (!categorySchema) {
          callback(new GSError(errorCodes.NOT_FOUND));
          return;
        }
        foundAction = categorySchema.actions.get(action);
      }
      if (!foundAction) {
        callback(new GSError(errorCodes.NOT_FOUND));
        return;
      }
      const args = actionArgs[1];
      const error = this.schema.validate('action', foundAction, args);
      if (error) {
        process.nextTick(
          callback,
          new GSError(
            errorCodes.INVALID_SCHEMA,
            `Invalid arguments provided: ${error}`
          )
        );
        return;
      }
      const { Execute: execute } = foundAction.definition;
      execute(this, ...actionArgs, callback);
    });
  }

  log(op, args, ctx, response) {
    const record = {
      ...ctx,
      DateTime: new Date(),
      Operation: opToUserAccess[op],
      Response: response,
    };
    fillLogData[op](args, record);
    const provider = this[originalProvider] || this;
    prepareForLogging(provider, record);
    provider.create('Log', record, err => {
      if (err) {
        this.systemLogger(err);
      }
    });
  }

  // Get system suffix for given id
  //   id - <common.Uint64>
  //
  // Returns: <common.Uint64>
  getSystemSuffix(id) {
    return Uint64.and(id, this.systemBitmask);
  }

  // Check whether data with given id is stored on this system
  //   id - <common.Uint64>
  //
  // Returns: <boolean>
  curSystem(id) {
    return Uint64.cmp(this.getSystemSuffix(id), this.systemSuffix) === 0;
  }

  // Get server suffix for given id
  //   id - <common.Uint64>
  //
  // Returns: <common.Uint64>
  getServerSuffix(id) {
    return Uint64.and(id, this.serverBitmask);
  }

  // Check whether data with given id is stored on this server
  //   id - <common.Uint64>
  //
  // Returns: <boolean>
  curServer(id) {
    return Uint64.cmp(this.getServerSuffix(id), this.serverSuffix) === 0;
  }

  // Get id without system and server suffix
  //   id - <common.Uint64>
  //
  // Returns: <common.Uint64>
  getLocalId(id) {
    return Uint64.and(Uint64.not(this.serverBitmask), id);
  }

  // Parse id
  //   id - <common.Uint64>
  //
  // Returns: <Object>
  //   systemSuffix - <common.Uint64>, system suffix for given id
  //   serverSuffix - <common.Uint64>, server suffix for given id
  //   localId - <common.Uint64>, id without system and server suffix
  parseId(id) {
    return {
      systemSuffix: this.getSystemSuffix(id),
      serverSuffix: this.getServerSuffix(id),
      localId: this.getLocalId(id),
    };
  }

  // List all available applications
  //   callback - <Function>
  //     err - <Error> | <null>
  //     applications - <string[]>
  //   filtererByRoles - <Function> optional
  //     applications - <string[]>
  //     callback - <Function>
  //       err - <Error> | <null>
  //       applications - <string[]>
  listApplications(callback, filtererByRoles) {
    const result = [...this.schema.applications.keys()];
    if (filtererByRoles) {
      filtererByRoles(result, callback);
    } else {
      process.nextTick(callback, null, result);
    }
  }

  // List all available categories
  //   callback - <Function>
  //     err - <Error> | <null>
  //     categories - <string[]>
  //   filtererByPermission - <Function> optional
  //     categories - <string[]>
  //     callback - <Function>
  //       err - <Error> | <null>
  //       categories - <string[]>
  listCategories(callback, filtererByPermission) {
    const result = [...this.schema.categories.keys()];
    if (filtererByPermission) {
      filtererByPermission(result, callback);
    } else {
      process.nextTick(callback, null, result);
    }
  }

  // List all available actions
  //   callback - <Function>
  //     err - <Error> | <null>
  //     actions - <Object>
  //       public - <string[]>
  //       private - <Object>
  //         [categoryName] - <string[]>
  //   filtererByPermission - <Function> optional
  //     actions - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  //       actions - <Object>
  listActions(callback, filtererByPermission) {
    const result = {
      public: [...this.schema.actions.keys()],
      private: {},
    };
    for (const [key, value] of this.schema.categories) {
      if (value.actions.size !== 0) {
        result.private[key] = [...value.actions.keys()];
      }
    }
    if (filtererByPermission) {
      filtererByPermission(result, callback);
    } else {
      process.nextTick(callback, null, result);
    }
  }

  createJstpApi() {
    return createRemoteProviderJstpApi(this, this.cursorFactory);
  }

  getSchemaSources(callback, { categoryList, actionLists, appList } = {}) {
    process.nextTick(
      callback,
      null,
      iter(this.schema.schemas)
        .filter(schema => {
          if (!schema.source) return false;
          if (categoryList && schema.type === 'category') {
            return categoryList.includes(schema.name);
          }
          if (appList && schema.type === 'application') {
            return appList.includes(schema.name);
          }
          if (actionLists) {
            if (schema.type === 'action') {
              if (!schema.category) {
                return actionLists.public.includes(schema.name);
              } else {
                const categoryActions = actionLists.private[schema.category];
                return categoryActions && categoryActions.includes(schema.name);
              }
            } else if (schema.type === 'form') {
              const categoryActions = actionLists.private[schema.category];
              if (!categoryActions) return false;
              const { usedIn } = this.schema.categories
                .get(schema.category)
                .forms.get(schema.name);
              return usedIn.some(action => categoryActions.includes(action));
            }
          }
          return true;
        })
        .map(schema => ({
          type: schema.type,
          module: schema.module,
          name: schema.name,
          source: schema.source,
          category: schema.category,
        }))
        .toArray()
    );
  }

  getCategoryL10n(langTag, category, callback) {
    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      process.nextTick(
        callback,
        new GSError(errorCodes.NOT_FOUND, `No category ${category} found`)
      );
      return;
    }
    const l10n = categorySchema.resources.get(langTag);
    if (!l10n) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.NOT_FOUND,
          `No ${langTag} localization data for ${category} category`
        )
      );
      return;
    }
    process.nextTick(callback, null, l10n);
  }

  getDomainsL10n(langTag, callback) {
    const l10n = this.schema.resources.domains.get(langTag);
    if (!l10n) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.NOT_FOUND,
          `No ${langTag} localization data for domains`
        )
      );
      return;
    }
    process.nextTick(callback, null, l10n);
  }

  getCommonL10n(langTag, callback) {
    const l10n = this.schema.resources.common.get(langTag);
    if (!l10n) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.NOT_FOUND,
          `No ${langTag} localization data for common`
        )
      );
      return;
    }
    process.nextTick(callback, null, l10n);
  }

  getFormL10n(langTag, category, form, callback) {
    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      process.nextTick(
        callback,
        new GSError(errorCodes.NOT_FOUND, `No category ${category} found`)
      );
      return;
    }
    const formSchema = categorySchema.forms.get(form);
    if (!formSchema) {
      process.nextTick(
        callback,
        new GSError(errorCodes.NOT_FOUND, `No form ${category}.${form} found`)
      );
      return;
    }
    const l10n = formSchema.resources.get(langTag);
    if (!l10n) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.NOT_FOUND,
          `No ${langTag} localization data for ${category}.${form} form`
        )
      );
      return;
    }
    process.nextTick(callback, null, l10n);
  }

  getActionL10n(langTag, category, action, callback) {
    if (category === null) {
      const actionSchema = this.schema.actions.get(action);
      if (!actionSchema) {
        process.nextTick(
          callback,
          new GSError(errorCodes.NOT_FOUND, `No public action ${action} found`)
        );
        return;
      }
      const l10n = actionSchema.resources.get(langTag);
      if (!l10n) {
        process.nextTick(
          callback,
          new GSError(
            errorCodes.NOT_FOUND,
            `No ${langTag} localization data for public action ${action}`
          )
        );
        return;
      }
      process.nextTick(callback, null, l10n);
      return;
    }

    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      process.nextTick(
        callback,
        new GSError(errorCodes.NOT_FOUND, `No category ${category} found`)
      );
      return;
    }
    const actionSchema = categorySchema.actions.get(action);
    if (!actionSchema) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.NOT_FOUND,
          `No action ${category}.${action} found`
        )
      );
      return;
    }
    const l10n = actionSchema.resources.get(langTag);
    if (!l10n) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.NOT_FOUND,
          `No ${langTag} localization data for ${category}.${action} action`
        )
      );
    }
    process.nextTick(callback, null, l10n);
  }
}

module.exports = { StorageProvider };
