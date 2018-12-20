'use strict';

const metasync = require('metasync');
const { Uint64 } = require('@metarhia/common');

const { codes: errorCodes, GSError } = require('../../lib/errors');

const CATEGORY_NAME = 'Writer';
const ACTION_NAME = 'VeryUsefulAction';

const data = {
  Role: {
    0: {
      Name: 'Admin',
      Blocked: false,
    },
    1: {
      Name: 'User',
      Blocked: false,
    },
  },
  Permission: {
    2: {
      Role: 0,
      Category: CATEGORY_NAME,
      Access: new Uint64(31),
    },
    3: {
      Role: 1,
      Category: CATEGORY_NAME,
      Access: new Uint64(1),
    },
  },
  SystemUser: {
    4: {
      Login: 'AdminAdmin',
      Password:
        '$argon2id$v=19$m=4096,t=3,p=1$S1xPG8hsOCYip1dKOkjVYQ$ItOILC/' +
        'Hc97nR2d/Ocq5pNAFOWM0QZv06Em10EiRevE',
      Blocked: false,
    },
    5: {
      Login: 'UserUser',
      Password:
        '$argon2id$v=19$m=4096,t=3,p=1$S1xPG8hsOCYip1dKOkjVYQ$ItOILC/' +
        'Hc97nR2d/Ocq5pNAFOWM0QZv06Em10EiRevE',
      Blocked: false,
    },
  },
};

const details = [
  {
    category: 'Permission',
    field: 'Actions',
    fromId: 2,
    toId: 6,
  },
  {
    category: 'SystemUser',
    field: 'Roles',
    fromId: 4,
    toId: 0,
  },
  {
    category: 'SystemUser',
    field: 'Roles',
    fromId: 5,
    toId: 1,
  },
];

function getCategoryId(ctx, callback) {
  ctx.provider
    .select('Category', { Name: CATEGORY_NAME })
    .fetch((error, result) => {
      if (error) {
        callback(error);
        return;
      }
      ctx.categoryId = result[0].Id;
      callback(null);
    });
}

function getActionId(ctx, callback) {
  ctx.provider
    .select('Action', { Name: ACTION_NAME })
    .fetch((error, result) => {
      if (error) {
        callback(error);
        return;
      }
      data.Action = {
        6: result[0],
      };
      ctx.ids[6] = result[0].Id;
      ctx.actionId = result[0].Id;
      callback(null);
    });
}

function prepareRoles(ctx, callback) {
  metasync.each(
    Object.keys(data.Role),
    (key, callback) => {
      const role = data.Role[key];
      ctx.provider.create('Role', role, (err, id) => {
        ctx.ids[key] = id;
        role.Id = id;
        callback(err);
      });
    },
    callback
  );
}

function preparePermissions(ctx, callback) {
  metasync.each(
    Object.keys(data.Permission),
    (key, callback) => {
      const permission = data.Permission[key];
      permission.Role = data.Role[permission.Role].Id;
      permission.Category = ctx.categoryId;
      ctx.provider.create('Permission', permission, (err, id) => {
        ctx.ids[key] = id;
        permission.Id = id;
        callback(err);
      });
    },
    callback
  );
}

function prepareUsers(ctx, callback) {
  metasync.each(
    Object.keys(data.SystemUser),
    (key, callback) => {
      const user = data.SystemUser[key];
      ctx.provider.create('SystemUser', user, (err, id) => {
        ctx.ids[key] = id;
        user.Id = id;
        callback(err);
      });
    },
    callback
  );
}

function linkDetails(ctx, callback) {
  metasync.each(
    details,
    (detail, callback) =>
      ctx.provider.linkDetails(
        detail.category,
        detail.field,
        ctx.ids[detail.fromId],
        ctx.ids[detail.toId],
        callback
      ),
    callback
  );
}

function cachePermissions(ctx, callback) {
  metasync.each(
    [
      'Action',
      'Category',
      'Catalog',
      'Permission',
      'Role',
      'Subdivision',
      'SystemUser',
    ],
    (category, callback) => {
      ctx.provider.select(category, {}).fetch((error, result) => {
        if (error) {
          callback(error);
          return;
        }
        ctx.permissionData[category] = result;
        callback(null);
      });
    },
    error => {
      if (error) {
        callback(error);
        return;
      }
      details.forEach(detail => {
        const name = detail.category + detail.field;
        ctx.permissionData[name].push({
          [detail.category]: ctx.ids[detail.fromId].toString(),
          [detail.field]: ctx.ids[detail.toId].toString(),
        });
      });
      ctx.provider.cachePermissions(ctx.permissionData);
      callback(null);
    }
  );
}

module.exports = (provider, test) => {
  metasync.sequential(
    [
      getCategoryId,
      getActionId,
      prepareRoles,
      preparePermissions,
      prepareUsers,
      linkDetails,
      cachePermissions,
    ],
    {
      provider,
      ids: {},
      permissionData: {
        PermissionActions: [],
        SystemUserRoles: [],
      },
    },
    err => {
      if (err) {
        console.error(err);
        test.error(err);
        test.end();
        return;
      }

      test.endAfterSubtests();
      test.test('permitted', test => {
        const session = new Map([['Id', data.SystemUser[4].Id.toString()]]);
        provider.execute(
          CATEGORY_NAME,
          ACTION_NAME,
          session,
          { Arg: '42' },
          (err, msg) => {
            test.error(err);
            test.strictEqual(msg, '42');
            test.end();
          }
        );
      });

      test.test('not permitted', test => {
        const id = data.SystemUser[5].Id.toString();
        const session = new Map([['Id', id]]);
        provider.execute(
          CATEGORY_NAME,
          ACTION_NAME,
          session,
          { Arg: '42' },
          err => {
            test.isError(
              err,
              new GSError(
                errorCodes.NOT_AUTHORIZED,
                `User '${id}' is not authorized to execute ` +
                `'Writer.VeryUsefulAction'`
              )
            );
            test.end();
          }
        );
      });

      test.test('invalid signature', test => {
        const id = data.SystemUser[4].Id.toString();
        const session = new Map([['Id', id]]);
        provider.execute(
          CATEGORY_NAME,
          ACTION_NAME,
          session,
          { Arg: 42 },
          err => {
            test.isError(
              err,
              new GSError(
                errorCodes.INVALID_SIGNATURE,
                `Form 'Writer.VeryUsefulAction' validation error: ` +
                `Invalid type of property 'Writer.VeryUsefulAction.Arg', ` +
                `expected: 'string', actual: 'number'`
              )
            );
            test.end();
          }
        );
      });

      test.test('invalid category', test => {
        const id = data.SystemUser[5].Id.toString();
        const session = new Map([['Id', id]]);
        provider.execute(
          '__Category__',
          ACTION_NAME,
          session,
          { Arg: 42 },
          err => {
            test.isError(
              err,
              new GSError(
                errorCodes.INVALID_SCHEMA,
                `Undefined category '__Category__'`
              )
            );
            test.end();
          }
        );
      });

      test.test('invalid category', test => {
        const id = data.SystemUser[5].Id.toString();
        const session = new Map([['Id', id]]);
        provider.execute(
          CATEGORY_NAME,
          '__Action__',
          session,
          { Arg: 42 },
          err => {
            test.isError(
              err,
              new GSError(
                errorCodes.INVALID_SCHEMA,
                `Undefined action '__Action__'`
              )
            );
            test.end();
          }
        );
      });
    }
  );
};
