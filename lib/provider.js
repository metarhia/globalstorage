'use strict';

const { UInt64, iter } = require('@metarhia/common');

const { GSError, codes: errorCodes } = require('./errors');

const checkHierarchical = (id, record) => UInt64.cmp(record.Id, id) === 0 ||
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
  cachePemissions(data) {
    const Action = iter(data.Action).map(a => [a.Name, a]).collectTo(Map);
    const Category = iter(data.Category).map(c => [c.Name, c]).collectTo(Map);
    const Catalog = new Map();
    const Permission = new Map();
    const Role = new Map();
    const Subdivision = new Map();
    const SystemUser = new Map();

    data.Subdivision.forEach(subdivision => {
      if (subdivision.Parent) {
        subdivision.Parent = Subdivision.get(subdivision.Parent.toString());
        if (!subdivision.Parent) {
          const parent = data.Subdivision.find(
            parent => UInt64.cmp(parent.Id, subdivision.Parent) === 0
          );

          subdivision.Parent = parent;
          Subdivision.set(parent.Id.toString(), parent);
        }
      }

      const id = subdivision.Id.toString();
      if (!Subdivision.has(id)) {
        Subdivision.set(id, subdivision);
      }
    });

    data.Catalog.forEach(catalog => {
      if (catalog.Parent) {
        catalog.Parent = Catalog.get(catalog.Parent);
        if (catalog.Parent) {
          const parent = data.Catalog.find(
            parent => UInt64.cmp(parent.Id, catalog.Parent) === 0
          );

          catalog.Parent = parent;
          Subdivision.set(parent.Id.toString(), parent);
        }
      }

      const id = catalog.Id.toString();
      if (!Subdivision.has(id)) {
        Subdivision.set(id, catalog);
      }
    });

    data.Role.forEach(role => {
      role.Permissions = [];
      Role.set(role.Id.toString(), role);
    });

    data.Permission.forEach(permission => {
      permission.Actions = [];
      Role.get(permission.Role.toString()).Permissions.push(permission);
      Permission.set(permission.Id.toString(), permission);
    });

    data.PermissionActions.forEach(permissionAction => Permission
      .get(permissionAction.Permission.toString())
      .Actions.push(permissionAction.Action));

    data.SystemUser.forEach(user => {
      user.Roles = [];
      SystemUser.set(user.Id.toString(), user);
    });

    data.SystemUserRoles.forEach(userRole => SystemUser
      .get(userRole.SystemUser.toString())
      .Roles.push(Role.get(userRole.Role.toString())));

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
  //   categoryId - <common.Uint64>, name of a category that the Action is
  //       defined upon
  //   actionId - <common.Uint64>, name of an Action to execute,
  //       this argument contradicts accessFlag
  //   accessFlag - <string>, this argument contradicts actionID
  //   userId - <common.Uint64>, id of user that executes an Action
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
    this.gs.get(args.Identifier, (error, record) => {
      if (error) {
        callback(error);
      }

      const { Catalog, Subdivision } = record;

      for (const { Permissions } of user.Roles) {
        const permission = Permissions.find(permission => {
          if (actionId && !permission.Actions.find(
            action => UInt64.cmp(action, actionId) === 0
          )) {
            return false;
          }

          if (accessFlag && permission.Access.get(accessFlag)) {
            return false;
          }

          if (permission.Category.equal(categoryId)) {
            return false;
          }

          if (UInt64.cmp(permission.Target, args.Identifier) === 0) {
            return true;
          }

          if (Catalog && !checkHierarchical(
            Catalog, this.gs.permissionCache.Catalog.get(Catalog)
          )) {
            return false;
          }

          if (Subdivision && !checkHierarchical(
            Subdivision, this.gs.permissionCache.Subdivision.get(Subdivision)
          )) {
            return false;
          }

          return true;
        });

        if (permission) {
          callback(null, true);
          break;
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
    const actionId = this.gs.permissionCache.Actions.get(name).Id;
    const categoryId = this.gs.permissionCache.Categories.get(category).Id;
    if (!action) {
      callback(new GSError(
        errorCodes.NO_SUCH_ACTION,
        `There is no such action as '${name}' in '${category}' category`
      ));
      return;
    }
    this.checkPermission(
      categoryId, actionId, userId, args, (error, permitted) => {
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
        const validationError = this.schema.gs.validateForm(form, args);
        if (!validationError) {
          callback(new GSError(
            errorCodes.INVALID_SIGNATURE,
            `Form '${form}' validation error: ${validationError.toString()}`
          ));
          return;
        }
        const { Execute: fn } = action;
        fn(args, callback);
      }
    );
  }
}

module.exports = { StorageProvider };
