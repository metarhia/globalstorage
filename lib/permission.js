'use strict';

const metasync = require('metasync');
const { Uint64 } = require('@metarhia/common');

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
        SELECT 1 FROM "Permission" perm
          WHERE sur."Roles" = "Role" AND
            (SELECT NOT "Blocked" FROM "Role" WHERE "Id" = perm."Role") AND
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
            (SELECT NOT "Blocked" FROM "Role" WHERE "Id" = perm."Role") AND
            "Category" = (
              SELECT "Id" FROM "Category" WHERE "Name" = $2
            ) AND EXISTS (
              SELECT 1 FROM "PermissionActions"
                WHERE "Permission" = perm."Id" AND
                "Actions" IN (
                  SELECT "Id" FROM "Action" WHERE "Name" = $3
                )
            )
      )
)`;

const categoryFilterQuery = `
SELECT DISTINCT "Category"."Name" FROM "Category"
  INNER JOIN "Permission" ON "Permission"."Category" = "Category"."Id"
  INNER JOIN (SELECT unnest($2::text[]) "Name") "PossibleCategory" ON
    "PossibleCategory"."Name" = "Category"."Name"
  WHERE "Permission"."Role" IN (
    SELECT "Roles" FROM "SystemUserRoles" WHERE "SystemUser" = $1
  )`;

const actionFilterQuery = `
SELECT DISTINCT ON ("Category"."Name", "Action"."Name")
  "Category"."Name" "Category", "Action"."Name" "Action" FROM "Category"
  INNER JOIN "Permission" ON "Permission"."Category" = "Category"."Id"
  INNER JOIN "PermissionActions" ON
    "PermissionActions"."Permission" = "Permission"."Id"
  INNER JOIN "Action" ON "Action"."Id" = "PermissionActions"."Actions"
  INNER JOIN unnest($2::text[], $3::text[])
    "SchemaActions" ("Category", "Action") ON
      "SchemaActions"."Category" = "Category"."Name" AND
      "SchemaActions"."Action" = "Action"."Name"
  WHERE "Permission"."Role" IN (
    SELECT "Roles" FROM "SystemUserRoles" WHERE "SystemUser" = $1
  )`;

const checkPermission = (provider, accessType, category, userId, callback) => {
  const flag = permissionFlags[accessType];
  provider.pool.query(categoryQuery(), [userId, category, flag], (err, res) => {
    if (err) {
      callback(err);
    } else {
      callback(null, res.rows[0].exists);
    }
  });
};

const validateIdString = id => new Uint64(id).toString() === id;

const validateQuery = (provider, category, query) => {
  const categorySchema = provider.schema.categories.get(category);
  const catalogField = categorySchema.catalog;
  if (
    catalogField &&
    (!query[catalogField] || !validateIdString(query[catalogField]))
  ) {
    return false;
  }
  const subdivisionField = categorySchema.subdivision;
  if (
    subdivisionField &&
    (!query[subdivisionField] || !validateIdString(query[subdivisionField]))
  ) {
    return false;
  }
  return true;
};

const checkPermissionComplex = (
  provider,
  accessType,
  category,
  userId,
  { record, id, isPatch, isQuery },
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
  runIf(id, getRecord, category, id, (err, dbRec) => {
    if (err) {
      callback(err);
      return;
    }
    if (dbRec) record = dbRec;
    if (!record || (isQuery && !validateQuery(provider, category, record))) {
      callback(null, false);
      return;
    }
    const categorySchema = provider.schema.categories.get(category);
    const flag = permissionFlags[accessType];
    const ops = [];
    if (categorySchema.catalog) {
      const catalogValue = record[categorySchema.catalog];
      if (!isPatch || catalogValue) {
        ops.push({
          query: categoryQuery(escapeIdentifier('Catalog')),
          args: [userId, category, flag, catalogValue],
        });
      }
    }
    if (categorySchema.subdivision) {
      const subdivisionValue = record[categorySchema.subdivision];
      if (!isPatch || subdivisionValue) {
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

const filterCategories = (provider, categories, userId, callback) => {
  provider.pool.query(categoryFilterQuery, [userId, categories], (err, res) => {
    if (err) {
      callback(err);
      return;
    }

    callback(null, res.rows.map(r => r.Name));
  });
};

const filterActions = (provider, actions, userId, callback) => {
  const preparedActions = [[], []];
  for (const [cat, acts] of Object.entries(actions.private)) {
    // TODO: replace with common.pushSame() after it becomes available there
    // See https://github.com/metarhia/common/pull/257
    const from = preparedActions[0].length;
    preparedActions[0].length += acts.length;
    preparedActions[0].fill(cat, from);
    preparedActions[1].push(...acts);
  }
  provider.pool.query(
    actionFilterQuery,
    [userId, ...preparedActions],
    (err, res) => {
      if (err) {
        callback(err);
        return;
      }

      const result = {
        public: actions.public,
        private: {},
      };

      for (const row of res.rows) {
        if (!result.private[row.Category]) {
          result.private[row.Category] = [row.Action];
        } else {
          result.private[row.Category].push(row.Action);
        }
      }

      callback(null, result);
    }
  );
};

module.exports = {
  checkPermission,
  checkPermissionComplex,
  checkExecutePermission,
  filterCategories,
  filterActions,
};
