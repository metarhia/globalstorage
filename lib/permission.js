'use strict';

const metasync = require('metasync');
const { iter } = require('@metarhia/common');
const { SelectBuilder } = require('./sqlgen');

const permissionFlags = {
  read: 0b0001,
  insert: 0b0010,
  update: 0b0100,
  delete: 0b1000,
};

const checkPermissionFlag = (actionType, flags) =>
  (flags & permissionFlags[actionType]) !== 0;

const selectRolesPermissions = (fieldsToSelect, category, roleIds) =>
  new SelectBuilder()
    .select(...fieldsToSelect)
    .from('Permission')
    .innerJoin('Category', 'Category.Id', 'Permission.Category')
    .innerJoin('Role', 'Role.Id', 'Permission.Role')
    .where('Category.Name', '=', category)
    .whereAny('Role.Id', roleIds);

const checkPermission = (provider, accessType, category, userId, callback) => {
  provider.getDetails(userId, 'Roles', (err, roles) => {
    if (err) {
      callback(err);
      return;
    }

    const sb = selectRolesPermissions(
      ['Access', 'Catalog', 'Subdivision'],
      category,
      roles.map(r => r.Id)
    );
    provider.pool.query(...sb.build(), (err, accessFlags) => {
      if (err) {
        callback(err);
        return;
      }

      for (const flags of accessFlags.rows) {
        if (checkPermissionFlag(accessType, flags.Access)) {
          callback(null, true);
          return;
        }
      }
      callback(null, false);
    });
  });
};

const checkExecutePermission = (
  provider,
  category,
  action,
  userId,
  callback
) => {
  if (category === null) {
    process.nextTick(callback, provider.schema.actions.has(action));
    return;
  }
  provider.getDetails(userId, 'Roles', (err, roles) => {
    if (err) {
      callback(err);
      return;
    }

    const sb = selectRolesPermissions(['Id'], category, roles.map(r => r.Id));
    provider.pool.query(...sb.build(), (err, permissions) => {
      if (err) {
        callback(err);
        return;
      }

      metasync.map(
        permissions.rows,
        (p, callback) => {
          provider.getDetails(p.Id, 'Actions', callback);
        },
        (err, actions) => {
          if (err) {
            callback(err);
            return;
          }
          callback(
            null,
            iter(actions)
              .flatMap(action => action.Name)
              .includes(action)
          );
        }
      );
    });
  });
};

module.exports = {
  checkPermission,
  checkExecutePermission,
};
