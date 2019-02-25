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

const categoryQuery = div => `
SELECT EXISTS (
  SELECT 1 FROM "SystemUserRoles" sur
    WHERE "SystemUser" = $1 AND
      EXISTS (
        SELECT 1 FROM "Permission"
          WHERE sur."Roles" = "Role" AND
            "Category" = (
              SELECT "Id" FROM "Category" WHERE "Name" = $2
            ) AND "Access" & $3 <> 0 ${div ? `AND ${div} = $4` : ''}
      )
)`;

const actionQuery = `
SELECT EXISTS (
  SELECT 1 FROM "SystemUserRoles" sur
    WHERE "SystemUser" = $1 AND
      EXISTS (
        SELECT 1 FROM "Permission" perm
          WHERE sur."Roles" = "Role" AND
            "Category" = (
              SELECT "Id" FROM "Category" WHERE "Name" = $2
            ) AND EXISTS (
              SELECT 1 FROM "PermissionActions"
                WHERE "Permission" = perm."Id" AND
                "Actions" = (
                  SELECT "Id" FROM "Action" WHERE "Name" = $4
                )
            )
      )
)`;

const checkPermission = (
  provider,
  accessType,
  category,
  userId,
  record,
  callback
) => {
  const categorySchema = provider.schema.categories.get(category);
  // TODO check subdivision and catalog here
  const ops = [];
  const flag = permissionsFlags[accessType];
  provider.pool.query(categoryQuery(), [userId, category, flag], (err, res) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, res.rows[0].exists);
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

  provider.pool.query(actionQuery, [userId, category, action], (err, res) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, res.rows[0].exists);
  });
};

module.exports = {
  checkPermission,
  checkExecutePermission,
};
