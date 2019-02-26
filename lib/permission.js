'use strict';

const metasync = require('metasync');

const { escapeIdentifier } = require('./pg.utils');
const { runIf } = require('./utils');

const permissionFlags = {
  read: 0b0001,
  insert: 0b0010,
  update: 0b0100,
  delete: 0b1000,
};

// TODO replace the SQL queries with Cursor usage so that it is not pinned to
// Postgres

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
                  SELECT "Id" FROM "Action" WHERE "Name" = $3
                )
            )
      )
)`;

const checkPermission = (
  provider,
  accessType,
  category,
  userId,
  { record, id },
  callback
) => {
  const getRecord = (category, id, callback) => {
    provider.pool.query(
      `SELECT * FROM ${escapeIdentifier(category)} WHERE "Id" = $1`,
      [id],
      (err, res) => {
        if (err) {
          callback(err);
        } else {
          callback(null, res.rows[0]);
        }
      }
    );
  };
  runIf(!record, getRecord, category, id, (err, rec) => {
    if (rec) record = rec;
    if (!record) {
      callback(null, false);
      return;
    }
    const categorySchema = provider.schema.categories.get(category);
    const flag = permissionFlags[accessType];
    const ops = [];
    if (!categorySchema.catalog && !categorySchema.subdivision) {
      ops.push({
        query: categoryQuery(),
        args: [userId, category, flag],
      });
    } else {
      if (categorySchema.catalog) {
        const catalogValue = record[categorySchema.catalog];
        ops.push({
          query: categoryQuery(escapeIdentifier('Catalog')),
          args: [userId, category, flag, catalogValue],
        });
      }
      if (categorySchema.subdivision) {
        const subdivisionValue = record[categorySchema.subdivision];
        ops.push({
          query: categoryQuery(escapeIdentifier('Subdivision')),
          args: [userId, category, flag, subdivisionValue],
        });
      }
    }
    metasync.map(
      ops,
      (op, callback) => {
        provider.pool.query(op.query, op.args, (err, res) => {
          if (err) {
            callback(err);
          } else {
            callback(null, res.rows[0].exists);
          }
        });
      },
      (err, res) => {
        if (err) {
          callback(err);
        } else {
          callback(null, !res.includes(false));
        }
      }
    );
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
    process.nextTick(callback, null, provider.schema.actions.has(action));
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
