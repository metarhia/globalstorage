'use strict';

const { iter } = require('@metarhia/common');

const { GSError, codes: errorCodes } = require('./errors');

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
  //     Identifier - <string>
  //     Catalog - <string>
  //     Subdivision - <string>
  checkPermission(categoryId, actionId, accessFlag, userId, args) {
    if (accessFlag && actionId) {
      throw new TypeError(
        '\'actionId\' and \'accessFlag\' arguments are contradictory'
      );
    }
    const user = this.gs.permissionCache.SystemUser.get(userId);

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
  //   args - <Object>, object that contains arguments of an action
  //     Identifier - <string>
  //     Catalog - <string>
  //     Subdivision - <string>
  //   callback - <Function>
  //     error - <Error>
  //     message - <string>
  execute(category, name, session, args, callback) {
    const categoryDefinition = this.gs.schema.actions.get(category);
    if (!categoryDefinition) {
      callback(
        new GSError(
          errorCodes.INVALID_SCHEMA, `Undefined category '${category}'`
        )
      );
      return;
    }

    const action = categoryDefinition.get(name);
    if (!action) {
      callback(
        new GSError(
          errorCodes.INVALID_SCHEMA, `Undefined action '${name}'`
        )
      );
      return;
    }

    const actionId = this.gs.permissionCache.Action.get(name).Id;
    const categoryId = this.gs.permissionCache.Category.get(category).Id;
    if (!action) {
      callback(new GSError(
        errorCodes.NO_SUCH_ACTION,
        `There is no such action as '${name}' in '${category}' category`
      ));
      return;
    }

    const form = `${category}.${name}`;
    const execute = () => {
      const validationError = this.gs.schema.validateForm(form, args);
      if (validationError) {
        callback(new GSError(
          errorCodes.INVALID_SIGNATURE,
          `Form '${form}' validation error: ${validationError.toString()}`
        ));
        return;
      }
      const { definition: fn } = action;
      fn(session, args, callback);
    };

    if (
      category === 'SystemUser' &&
      (name === 'SignIn' || name === 'SignUp' || name === 'SignOut')
    ) {
      execute();
      return;
    }

    const userId = session.get('Id');
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

        execute();
      }
    );
  }
}

module.exports = { StorageProvider };
