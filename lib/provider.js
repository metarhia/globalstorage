'use strict';

const { iter } = require('@metarhia/common');

const { GSError, codes: errorCodes } = require('./errors');

const checkHierarchical = (id, record) => record.Id === id ||
  (record.Id !== null && checkHierarchical(id, record.Parent));

// Abstract Storage Provider
class StorageProvider {
  // Create StorageProvider
  //   gs - globalstorage instance
  constructor(gs) {
    this.gs = gs;
  }

  // Open StorageProvider
  //   callback - function(err, StorageProvider)
  // eslint-disable-next-line no-unused-vars
  open(options, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Close StorageProvider
  //   callback - function(err)
  // eslint-disable-next-line no-unused-vars
  close(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Generate globally unique id
  //   callback - function(err, id)
  // eslint-disable-next-line no-unused-vars
  takeId(callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Get object from GlobalStorage
  //   id - globally unique object id
  //   callback - function(err, obj)
  // eslint-disable-next-line no-unused-vars
  get(id, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Set object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err)
  // eslint-disable-next-line no-unused-vars
  set(obj, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Create object in GlobalStorage
  //   category - string, category to store the object in
  //   obj - object to be stored
  //   callback - function(err, id)
  // eslint-disable-next-line no-unused-vars
  create(category, obj, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Update object in GlobalStorage
  //   category - string, category to update the records in
  //   query - object, example: { Id }
  //   patch - object, fields to update
  //   callback - function(err, count)
  // eslint-disable-next-line no-unused-vars
  update(category, query, patch, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Delete object in GlobalStorage
  //   category - string, category to delete the records from
  //   query - object, example: { Id }
  //   callback - function(err, count)
  // eslint-disable-next-line no-unused-vars
  delete(category, query, callback) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Select objects from GlobalStorage
  //   category - string, category to select the records from
  //   query - fields conditions
  // Returns: Cursor
  // eslint-disable-next-line no-unused-vars
  select(category, query) {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
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
    const Catalog = new Map();
    const Permission = new Map();
    const Role = new Map();
    const Subdivision = new Map();
    const SystemUser = new Map();

    data.Subdivision.forEach(subdivision => {
      if (subdivision.Parent) {
        subdivision.Parent = Subdivision.get(subdivision.Parent);
        if (!subdivision.Parent) {
          const parent = data.Subdivision.find(
            parent => parent.Id === subdivision.Parent
          );

          subdivision.Parent = parent;
          Subdivision.set(parent.Id, parent);
        }
      }

      const id = subdivision.Id;
      if (!Subdivision.has(id)) {
        Subdivision.set(id, subdivision);
      }
    });

    data.Catalog.forEach(catalog => {
      if (catalog.Parent) {
        catalog.Parent = Catalog.get(catalog.Parent);
        if (catalog.Parent) {
          const parent = data.Catalog.find(
            parent => parent.Id === catalog.Parent
          );

          catalog.Parent = parent;
          Subdivision.set(parent.Id, parent);
        }
      }

      const id = catalog.Id;
      if (!Subdivision.has(id)) {
        Subdivision.set(id, catalog);
      }
    });

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
      .Actions.push(permissionAction.Action));

    data.SystemUser.forEach(user => {
      user.Roles = [];
      SystemUser.set(user.Id, user);
    });

    data.SystemUserRoles.forEach(userRole => SystemUser
      .get(userRole.SystemUser)
      .Roles.push(Role.get(userRole.Role)));

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
  //   categoryId - <string>, id of a category that the Action is defined upon
  //   actionId - <string>, id of an Action to execute,
  //       this argument contradicts accessFlag
  //   accessFlag - <string>, this argument contradicts actionID
  //   userId - <string>, id of user that executes an Action
  //   args - <Object>, object that contains arguments of an action
  //   callback - <Function>
  //     error - <Error>
  //     permission - <boolean>
  checkPermission(categoryId, actionId, accessFlag, userId, args, callback) {
    if (accessFlag && actionId) {
      throw new TypeError(
        '\'actionId\' and \'accessFlag\' arguments are contradictory'
      );
    }
    const user = this.gs.permissionCache.SystemUser.get(userId);
    this.get(args.Identifier, (error, record) => {
      if (error) {
        callback(error);
        return;
      }

      const { Catalog, Subdivision } = record;

      for (const { Permissions } of user.Roles) {
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

          if (permission.Target === args.Identifier) {
            return true;
          }

          const catalog = permission.catalog;
          if (Catalog && catalog &&
            !checkHierarchical(
              catalog, this.gs.permissionCache.Catalog.get(Catalog)
            )
          ) {
            return false;
          }

          const subdivision = permission.subdivision;
          if (Subdivision && subdivision &&
            !checkHierarchical(
              subdivision, this.gs.permissionCache.Subdivision.get(Subdivision)
            )
          ) {
            return false;
          }

          return true;
        });

        if (permission) {
          callback(null, true);
          return;
        }
      }

      callback(null, false);
    });
  }

  // Execute Action
  //   category - <string>, name of a category that the action is defined upon
  //   name - <string>, name of an Action to execute
  //   userId - <common.Uint64>, id of user that executes an Action
  //   args - <Object>, object that contains arguments of an action
  //   callback - <Function>
  //     error - <Error>
  //     message - <string>
  execute(category, name, userId, args, callback) {
    const form = `${category}.${name}`;
    const action = this.gs.schema.actions.get(category).get(name);
    const actionId = this.gs.permissionCache.Action.get(name).Id;
    const categoryId = this.gs.permissionCache.Category.get(category).Id;
    if (!action) {
      callback(new GSError(
        errorCodes.NO_SUCH_ACTION,
        `There is no such action as '${name}' in '${category}' category`
      ));
      return;
    }
    this.checkPermission(
      categoryId, actionId, null, userId, args, (error, permitted) => {
        if (error) {
          callback(error);
          return;
        }
        if (!permitted) {
          callback(new GSError(
            errorCodes.NOT_AUTHORIZED,
            `User '${userId.toString()}' is not authorized to execute '${form}'`
          ));
          return;
        }
        const validationError = this.gs.schema.validateForm(form, args);
        if (!validationError) {
          callback(new GSError(
            errorCodes.INVALID_SIGNATURE,
            `Form '${form}' validation error: ${validationError.toString()}`
          ));
          return;
        }
        const { definition: fn } = action;
        fn(args, callback);
      }
    );
  }
}

module.exports = { StorageProvider };
