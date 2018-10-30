'use strict';

const { Uint64, iter } = require('@metarhia/common');

const { GSError, codes: errorCodes } = require('./errors');
const { createRemoteProviderJstpApi } =
  require('./remote.provider.jstp.api.js');

const SYSTEM_BITMASK_SIZE = 24;

// Abstract Storage Provider
class StorageProvider {
  // Create StorageProvider
  //   options <Object>
  //     serverSuffix <Uint64> optional
  //     serverBitmask <Uint64> optional
  //     systemSuffix <Uint64> optional
  //     systemBitmas <Uint64> optional
  constructor({
    serverSuffix = null,
    serverBitmask = null,
    systemSuffix = null,
    systemBitmask = null,
  }) {
    this.active = false;
    this.cursorFactory = null;
    this.schema = null;
    this.serverSuffix = serverSuffix;
    this.serverBitmask = serverBitmask;
    this.systemSuffix = systemSuffix;
    this.systemBitmask = systemBitmask;
    this.serverBitmaskSize = null;
    if (this.serverBitmask !== null) {
      this.serverBitmaskSize = this.serverBitmask.toString(2).length;
    }
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

  createJstpApi() {
    return createRemoteProviderJstpApi(this, this.cursorFactory);
  }

  // Links and caches Permission related categories
  //   data - <Object>, data to be cached
  //     Action - <Action[]>
  //     Category - <Category[]>
  //     Catalog - <Catalog[]>
  //     Permission - <Permission[]>
  //     PermissionActions - <PermissionActions[]>
  //     Role - <Role[]>
  //     Subdivision - <Subdivision[]>
  //     SystemUser - <SystemUser[]>
  //     SystemUserRoles - <SystemUserRoles[]>
  cachePermissions(data) {
    const Action = iter(data.Action).map(a => [a.Name, a]).collectTo(Map);
    const Category = iter(data.Category).map(c => [c.Name, c]).collectTo(Map);
    const Permission = new Map();
    const Role = new Map();
    const SystemUser = new Map();

    const processHierarchical = nodes => {
      const map = iter(nodes).map(node => {
        node.Parent = null;
        node.children = [];
        return [node.Name, node];
      }).collectTo(Map);

      nodes.forEach(node => {
        if (node.Parent) {
          const parent = map.get(node.Parent);
          node.Parent = parent;
          parent.children.push(node);
        }
      });

      return map;
    };


    const Catalog = processHierarchical(data.Catalog);
    const Subdivision = processHierarchical(data.Subdivision);

    data.Role.forEach(role => {
      role.Permissions = [];
      Role.set(role.Id, role);
    });

    data.Permission.forEach(permission => {
      permission.Actions = [];
      Role.get(permission.Role).Permissions.push(permission);
      Permission.set(permission.Id, permission);
    });

    data.PermissionActions.forEach(permissionAction => Permission
      .get(permissionAction.Permission)
      .Actions.push(permissionAction.Actions));

    data.SystemUser.forEach(user => {
      user.Roles = [];
      SystemUser.set(user.Id, user);
    });

    data.SystemUserRoles.forEach(userRole => SystemUser
      .get(userRole.SystemUser)
      .Roles.push(Role.get(userRole.Roles)));

    this.gs.permissionCache = {
      Action,
      Category,
      Catalog,
      Permission,
      Role,
      Subdivision,
      SystemUser,
    };
  }

  // Check that given user has access to execute the Action
  //   category - <string>, name of a category
  //   actionId - <string>, id of the Action to execute,
  //       this argument contradicts accessFlag
  //   accessFlag - <string>, this argument contradicts actionID
  //   userId - <string>, id of user that executes the Action
  //   args - <Object>, object that contains arguments of the action
  //     Identifier - <string>
  //     Catalog - <string>
  //     Subdivision - <string>
  checkPermission(category, actionId, accessFlag, userId, args) {
    if (accessFlag && actionId) {
      throw new TypeError(
        '\'actionId\' and \'accessFlag\' arguments are contradictory'
      );
    }
    const user = this.gs.permissionCache.SystemUser.get(userId);
    const categoryId = this.gs.permissionCache.Category.get(category).Id;

    const { Identifier, Catalog, Subdivision } = args;

    for (const { Permissions } of user.Roles) {
      // eslint-disable-next-line no-loop-func
      const permission = Permissions.find(permission => {
        if (actionId && !permission.Actions.find(
          action => action === actionId
        )) {
          return false;
        }

        if (accessFlag && permission.Access.get(accessFlag)) {
          return false;
        }

        if (permission.Category !== categoryId) {
          return false;
        }

        if (permission.Target === Identifier) {
          return true;
        }

        const catalog = this.gs.permissionCache.Catalog.get(permission.Catalog);
        const subdivision =
          this.gs.permissionCache.Subdivision.get(permission.Subdivision);
        if (
          Catalog && catalog && catalog.includes(Catalog) ||
          Subdivision && subdivision && subdivision.includes(Subdivision)
        ) {
          return false;
        }

        return true;
      });

      if (permission) {
        return true;
      }
    }

    return false;
  }

  // Execute Action
  //   category - <string>, name of a category that the action is defined upon
  //   name - <string>, name of an Action to execute
  //   session - <jstp.Session>
  //   args - <Object>, object that contains arguments of the action
  //     Identifier - <string>
  //     Catalog - <string>
  //     Subdivision - <string>
  //   callback - <Function>
  //     error - <Error>
  //     message - <string>
  execute(category, name, session, args, callback) {
    const categoryActions = this.gs.schema.actions.get(category);
    if (!categoryActions) {
      callback(
        new GSError(
          errorCodes.INVALID_SCHEMA, `Undefined category '${category}'`
        )
      );
      return;
    }

    const action = categoryActions.get(name);
    if (!action) {
      callback(
        new GSError(
          errorCodes.INVALID_SCHEMA, `Undefined action '${name}'`
        )
      );
      return;
    }

    if (!action) {
      callback(new GSError(
        errorCodes.NO_SUCH_ACTION,
        `There is no such action '${name}' in '${category}' category`
      ));
      return;
    }

    const actionId = this.gs.permissionCache.Action.get(name).Id;
    const form = `${category}.${action.definition.Formm || name}`;

    if (
      category !== 'SystemUser' ||
      (name !== 'SignIn' && name !== 'SignUp' && name !== 'SignOut')
    ) {
      const userId = session.get('Id');
      const permitted =
        this.checkPermission(category, actionId, null, userId, args);

      if (!permitted) {
        callback(new GSError(
          errorCodes.NOT_AUTHORIZED,
          `User '${userId.toString()}' is not authorized to execute '${form}'`
        ));
        return;
      }
    }

    const validationError = this.gs.schema.validateForm(form, args);
    if (validationError) {
      callback(new GSError(
        errorCodes.INVALID_SIGNATURE,
        `Form '${form}' validation error: ${validationError.toString()}`
      ));
      return;
    }

    const { Execute: fn } = action.definition;
    fn(session, args, callback);
  }
}

module.exports = {
  StorageProvider,
  SYSTEM_BITMASK_SIZE,
};
