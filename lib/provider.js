'use strict';

const { Uint64, iter } = require('@metarhia/common');

const { ActionError, GSError, codes: errorCodes } = require('./errors');
const {
  createRemoteProviderJstpApi,
} = require('./remote.provider.jstp.api.js');
const { prepareForLogging, LogStatus } = require('./log');

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
    this.systemLogger = systemLogger || (() => {});
    this.serverSuffix = serverSuffix;
    this.serverBitmask = serverBitmask;
    this.systemSuffix = systemSuffix;
    this.systemBitmask = systemBitmask;
    this.serverBitmaskSize = this.serverBitmask.toString(2).length;
  }

  // Open StorageProvider
  //   options - <Object>
  //     schema - <Metaschema>
  // Returns: <Promise>
  async open({ schema }) {
    this.schema = schema;
  }

  // Close StorageProvider
  // Returns: <Promise>
  async close() {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Setup StorageProvider
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async setup(options) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  enableLogging(ctx) {
    return new Proxy(this, {
      get(provider, prop, proxy) {
        if (prop === originalProvider) return provider;
        if (prop === 'loggingEnabled') return true;
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
        return async (...args) => {
          provider.log(prop, args, ctx);
          return provider[prop].call(proxy, ...args).then(
            result => {
              provider.log(prop, args, ctx, result);
              return LogStatus.strip(result);
            },
            err => {
              provider.log(prop, args, ctx, err);
              throw LogStatus.strip(err);
            }
          );
        };
      },
    });
  }

  // Utility method to generate <ActionError> from inside the Action
  // Signature: name, ...ctx
  //   name <string> error name that must be equal to one of the values from the
  //       Action's Errors field
  //   ctx <Array>
  error(name, ...ctx) {
    return new ActionError(name, ctx);
  }

  // Generate globally unique id
  // Returns: <Promise>
  async takeId() {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get object from GlobalStorage
  // Signature: id[, permissionChecker]
  //   id - <string>, globally unique object id
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async get(id, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get details for many-to-many link from GlobalStorage
  // Signature: category, id, fieldName[, permissionChecker]
  //   category - <string>, category to get details in
  //   id - <string>, object id
  //   fieldName - <string>, field with the Many decorator
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async getDetails(category, id, fieldName, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  // Signature: obj[, permissionChecker]
  //   obj - <Object>, to be stored
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async set(obj, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  // Signature: category, obj[, permissionChecker]
  //   category - <string>, category to store the object in
  //   obj - <Object>, to be stored
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async create(category, obj, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  // Signature: category, query, patch[, permissionChecker]
  //   category - <string>, category to update the records in
  //   query - <Object>, example: `{ Id }`
  //   patch - <Object>, fields to update
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async update(category, query, patch, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  // Signature: category, query[, permissionChecker]
  //   category - <string>, category to delete the records from
  //   query - <Object>, example: `{ Id }`
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async delete(category, query, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Link records with Many relation between them
  // Signature: category, field, fromId, toIds[, permissionChecker]
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async linkDetails(category, field, fromId, toIds, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Unlink records with Many relation between them
  // Signature: category, field, fromId, toIds[, permissionChecker]
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  // eslint-disable-next-line no-unused-vars
  async unlinkDetails(category, field, fromId, toIds, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  // Signature: category, query[, permissionChecker]
  //   category - <string>, category to select the records from
  //   query - <Object>, fields conditions
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //   Returns: <Promise>
  //
  // Returns: <Cursor>
  // eslint-disable-next-line no-unused-vars
  select(category, query, permissionChecker) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Execute an action
  // Signature: category, action, actionArgs[, permissionChecker]
  //   category <string> | <null> category name or null to execute public action
  //   action <string> action name
  //   actionArgs <Object>
  //     context <Object>
  //     args <Object>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     action - <string>
  //   Returns: <Promise>
  // Returns: <Promise>
  async execute(category, action, actionArgs, permissionChecker) {
    if (permissionChecker) {
      await permissionChecker(category, action);
    }
    let foundAction;
    if (category === null) {
      foundAction = this.schema.actions.get(action);
    } else {
      const categorySchema = this.schema.categories.get(category);
      if (!categorySchema) {
        throw new GSError(errorCodes.NOT_FOUND);
      }
      foundAction = categorySchema.actions.get(action);
    }
    if (!foundAction) {
      throw new GSError(errorCodes.NOT_FOUND);
    }
    const [error, args] = this.schema.createAndValidate(
      'action',
      foundAction,
      actionArgs.args
    );
    if (error) {
      throw new GSError(
        errorCodes.INVALID_SCHEMA,
        `Invalid arguments provided: ${error}`
      );
    }
    const { Execute: execute, Errors: errors } = foundAction.definition;
    const { context } = actionArgs;
    const stripFn = this.loggingEnabled ? x => x : LogStatus.strip;
    return execute(this, context, args).then(stripFn, err => {
      LogStatus.apply(err, err => {
        if (
          err instanceof ActionError &&
          !(errors && errors.includes(err.message))
        ) {
          this.systemLogger(
            `${err.message} is not a valid error name for ` + category
              ? `action ${category}.${action}`
              : `public action ${action}`
          );
        }
      });

      throw stripFn(LogStatus.wrap(err, GSError.wrap));
    });
  }

  log(op, args, ctx, response) {
    const hasStatus = response instanceof LogStatus;
    const record = {
      ...ctx,
      DateTime: new Date(),
      Operation: opToUserAccess[op],
      Response: !hasStatus ? response : response.value,
      Status: !hasStatus ? 'info' : response.status,
      ServerId: this.serverSuffix,
    };
    fillLogData[op](args, record);
    const provider = this[originalProvider] || this;
    prepareForLogging(provider, record);
    provider.create('Log', record).catch(err => {
      this.systemLogger(err);
    });
  }

  // Get system suffix for given id
  //   id - <Uint64>
  //
  // Returns: <Uint64>
  getSystemSuffix(id) {
    return Uint64.and(id, this.systemBitmask);
  }

  // Check whether data with given id is stored on this system
  //   id - <Uint64>
  //
  // Returns: <boolean>
  curSystem(id) {
    return Uint64.cmp(this.getSystemSuffix(id), this.systemSuffix) === 0;
  }

  // Get server suffix for given id
  //   id - <Uint64>
  //
  // Returns: <Uint64>
  getServerSuffix(id) {
    return Uint64.and(id, this.serverBitmask);
  }

  // Check whether data with given id is stored on this server
  //   id - <Uint64>
  //
  // Returns: <boolean>
  curServer(id) {
    return Uint64.cmp(this.getServerSuffix(id), this.serverSuffix) === 0;
  }

  // Get id without system and server suffix
  //   id - <Uint64>
  //
  // Returns: <Uint64>
  getLocalId(id) {
    return Uint64.and(Uint64.not(this.serverBitmask), id);
  }

  // Parse id
  //   id - <Uint64>
  //
  // Returns: <Object>
  //   systemSuffix - <Uint64>, system suffix for given id
  //   serverSuffix - <Uint64>, server suffix for given id
  //   localId - <Uint64>, id without system and server suffix
  parseId(id) {
    return {
      systemSuffix: this.getSystemSuffix(id),
      serverSuffix: this.getServerSuffix(id),
      localId: this.getLocalId(id),
    };
  }

  // List all available applications
  // Signature: [filtererByRoles]
  //   filtererByRoles - <Function> optional
  //     applications - <string[]>
  //   Returns: <Promise>
  // Returns: <Promise>
  async listApplications(filtererByRoles) {
    const result = [...this.schema.applications.keys()];
    if (filtererByRoles) {
      return filtererByRoles(result);
    } else {
      return result;
    }
  }

  // List all available categories
  // Signature: [filtererByPermission]
  //   filtererByPermission - <Function> optional
  //     categories - <string[]>
  //   Returns: <Promise>
  // Returns: <Promise>
  async listCategories(filtererByPermission) {
    const result = [...this.schema.categories.keys()];
    if (filtererByPermission) {
      return filtererByPermission(result);
    } else {
      return result;
    }
  }

  // List all available actions
  // Signature: [filtererByPermission]
  //   filtererByPermission - <Function> optional
  //     actions - <Object>
  //   Returns: <Promise>
  // Returns: <Promise>
  async listActions(filtererByPermission) {
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
      return filtererByPermission(result);
    } else {
      return result;
    }
  }

  createJstpApi() {
    return createRemoteProviderJstpApi(this, this.cursorFactory);
  }

  async getSchemaSources({ categoryList, actionLists, appList } = {}) {
    return iter(this.schema.schemas)
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
      .toArray();
  }

  async getCategoryL10n(langTag, category) {
    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      throw new GSError(errorCodes.NOT_FOUND, `No category ${category} found`);
    }
    const l10n = categorySchema.resources.get(langTag);
    if (!l10n) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No ${langTag} localization data for ${category} category`
      );
    }
    return l10n;
  }

  async getDomainsL10n(langTag) {
    const l10n = this.schema.resources.domains.get(langTag);
    if (!l10n) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No ${langTag} localization data for domains`
      );
    }
    return l10n;
  }

  async getCommonL10n(langTag) {
    const l10n = this.schema.resources.common.get(langTag);
    if (!l10n) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No ${langTag} localization data for common`
      );
    }
    return l10n;
  }

  async getFormL10n(langTag, category, form) {
    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      throw new GSError(errorCodes.NOT_FOUND, `No category ${category} found`);
    }
    const formSchema = categorySchema.forms.get(form);
    if (!formSchema) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No form ${category}.${form} found`
      );
    }
    const l10n = formSchema.resources.get(langTag);
    if (!l10n) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No ${langTag} localization data for ${category}.${form} form`
      );
    }
    return l10n;
  }

  async getActionL10n(langTag, category, action) {
    if (category === null) {
      const actionSchema = this.schema.actions.get(action);
      if (!actionSchema) {
        throw new GSError(
          errorCodes.NOT_FOUND,
          `No public action ${action} found`
        );
      }
      const l10n = actionSchema.resources.get(langTag);
      if (!l10n) {
        throw new GSError(
          errorCodes.NOT_FOUND,
          `No ${langTag} localization data for public action ${action}`
        );
      }
      return l10n;
    }

    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      throw new GSError(errorCodes.NOT_FOUND, `No category ${category} found`);
    }
    const actionSchema = categorySchema.actions.get(action);
    if (!actionSchema) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No action ${category}.${action} found`
      );
    }
    const l10n = actionSchema.resources.get(langTag);
    if (!l10n) {
      throw new GSError(
        errorCodes.NOT_FOUND,
        `No ${langTag} localization data for ${category}.${action} action`
      );
    }
    return l10n;
  }
}

module.exports = { StorageProvider };
