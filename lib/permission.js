'use strict';

const { Uint64, pushSame } = require('@metarhia/common');

const { escapeIdentifier } = require('./pg.utils');

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

const categoryPermissionFilterQuery = `
SELECT "Category"."Name", bit_or("Permission"."Access") "Flags" FROM "Category"
  INNER JOIN "Permission" ON "Permission"."Category" = "Category"."Id"
  INNER JOIN (SELECT unnest($2::text[]) "Name") "PossibleCategory" ON
    "PossibleCategory"."Name" = "Category"."Name"
  WHERE "Permission"."Role" IN (
    SELECT "Roles" FROM "SystemUserRoles" WHERE "SystemUser" = $1
  )
  GROUP BY "Category"."Name"
`;

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

const applicationFilterQuery = `
SELECT DISTINCT "Application"."Name" FROM "Application"
  INNER JOIN "RoleApplications" ra ON "Application"."Id" = ra."Applications"
  INNER JOIN (SELECT unnest($2::text[]) "Name") "PossibleApp" ON
    "PossibleApp"."Name" = "Application"."Name"
  WHERE ra."Role" IN (
    SELECT "Roles" FROM "SystemUserRoles" WHERE "SystemUser" = $1
  )`;

const checkPermission = async (provider, accessType, category, userId) => {
  const flag = permissionFlags[accessType];
  try {
    const res = await provider.pool.query(categoryQuery(), [
      userId,
      category,
      flag,
    ]);
    return res.rows[0].exists;
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
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
  const subsystemField = categorySchema.subsystem;
  if (
    subsystemField &&
    (!query[subsystemField] || !validateIdString(query[subsystemField]))
  ) {
    return false;
  }
  return true;
};

const checkPermissionComplex = async (
  provider,
  accessType,
  category,
  userId,
  { record, id, isPatch, isQuery }
) => {
  const getRecord = async (category, id) => {
    const res = await provider.pool.query(
      `SELECT * FROM ${escapeIdentifier(category)} WHERE "Id" = $1`,
      [id]
    );
    return res.rows[0];
  };

  if (id) {
    try {
      const dbRec = await getRecord(category, id);
      if (dbRec) {
        record = dbRec;
      }
    } catch (err) {
      provider.systemLogger(err);
      throw err;
    }
  }
  if (!record || (isQuery && !validateQuery(provider, category, record))) {
    return false;
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
  if (categorySchema.subsystem) {
    const subsystemValue = record[categorySchema.subsystem];
    if (!isPatch || subsystemValue) {
      ops.push({
        query: categoryQuery(escapeIdentifier('Subsystem')),
        args: [userId, category, flag, subsystemValue],
      });
    }
  }
  try {
    const res = await Promise.all(
      ops.map(async op => {
        const res = await provider.pool.query(op.query, op.args);
        return res.rows[0].exists;
      })
    );
    return !res.includes(false);
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
};

const checkExecutePermission = async (provider, category, action, userId) => {
  if (category === null) {
    return provider.schema.actions.has(action);
  }

  try {
    const res = await provider.pool.query(actionQuery, [
      userId,
      category,
      action,
    ]);
    return res.rows[0].exists;
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
};

const filterCategories = async (provider, categories, userId) => {
  try {
    const res = await provider.pool.query(categoryFilterQuery, [
      userId,
      categories,
    ]);
    return res.rows.map(r => r.Name);
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
};

const filterCategoriesWithPermissions = async (
  provider,
  categories,
  userId
) => {
  try {
    const res = await provider.pool.query(categoryPermissionFilterQuery, [
      userId,
      categories,
    ]);
    const result = {};
    for (const { Name, Flags } of res.rows) {
      result[Name] = String(Flags);
    }
    return result;
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
};

const filterApplications = async (provider, applications, userId) => {
  try {
    const res = await provider.pool.query(applicationFilterQuery, [
      userId,
      applications,
    ]);
    return res.rows.map(r => r.Name);
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
};

const filterActions = async (provider, actions, userId) => {
  const preparedActions = [[], []];
  for (const [cat, acts] of Object.entries(actions.private)) {
    pushSame(preparedActions[0], acts.length, cat);
    preparedActions[1].push(...acts);
  }
  try {
    const res = await provider.pool.query(actionFilterQuery, [
      userId,
      ...preparedActions,
    ]);
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
    return result;
  } catch (err) {
    provider.systemLogger(err);
    throw err;
  }
};

module.exports = {
  checkPermission,
  checkPermissionComplex,
  checkExecutePermission,
  filterCategories,
  filterCategoriesWithPermissions,
  filterActions,
  filterApplications,
};
