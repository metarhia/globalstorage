'use strict';

const fs = require('fs');
const path = require('path');

const common = require('@metarhia/common');
const metaschema = require('metaschema');
const metasync = require('metasync');
const metatests = require('metatests');
const jstp = require('@metarhia/jstp');
const { Pool } = require('pg');
const argon2 = require('argon2');

const getPathFromCurrentDir = path.join.bind(path, __dirname);

const gs = require('.');
const { createRemoteProviderJstpApi } = require('./lib/remote.provider.jstp.api');
const { codes: errorCodes, GSError } = require('./lib/errors');
const { generateDDL } = require('./lib/pg.ddl');

gs.serverId = 4;
gs.serverIdBitCount = 3;
const pgOptions = {
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || '',
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
};

const pool = new Pool(pgOptions);
const provider = new gs.PostgresProvider(gs);

let userId;

const isSetup = process.argv[2] === 'true';

const api = { argon2, provider };

function prepareDB(callback) {
  metasync.sequential([
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      fs.readFile(
        getPathFromCurrentDir('.', 'sql', 'id.sql'),
        'utf8',
        (err, initSql) => {
          ctx.initSql = initSql;
          cb(err);
        });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      pool.query(ctx.initSql, err => {
        cb(err);
      });
    },
    cb => {
      metaschema.fs.loadAndCreate([
        getPathFromCurrentDir('.', 'schemas', 'system'),
        getPathFromCurrentDir('.', 'schemas', 'person_registry'),
        // TODO add other schemas here
      ], api, (err, schema) => {
        gs.schema = schema;
        cb(err);
      });
    },
    cb => {
      if (!isSetup) {
        cb();
        return;
      }
      pool.query(generateDDL(gs.schema), err => {
        cb(err);
      });
    },
    cb => {
      provider.open(pgOptions, cb);
    },
    cb => {
      if (!isSetup) {
        cb();
        return;
      }
      provider[gs.recreateIdTrigger](1000, 30, cb);
    },
    cb => {
      if (!isSetup) {
        cb();
        return;
      }
      provider[gs.uploadCategoriesAndActions](cb);
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      argon2.hash('Password', { type: argon2.argon2id })
        .then(Password => {
          provider.create('SystemUser', {
            Login: 'adminadmin',
            Password,
          }, (err, userId) => {
            ctx.adminId = userId;
            cb(err);
          });
        });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      argon2.hash('Password', { type: argon2.argon2id })
        .then(Password => {
          provider.create('SystemUser', {
            Login: 'useruser',
            Password,
          }, (err, userId) => {
            ctx.userId = userId;
            cb(err);
          });
        });
    },
    // Admin rights
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.create('Role', {
        Name: 'Admin',
      }, (err, roleId) => {
        ctx.roleId = roleId;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.select('Category', {
        Name: 'Country',
      }).fetch((err, res) => {
        ctx.categoryId = res && res[0] && res[0].Id;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.create('Permission', {
        Role: ctx.roleId,
        Category: ctx.categoryId,
        Access: new common.Uint64('0b11111'),
      }, (err, permissionId) => {
        ctx.permissionId = permissionId;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.select('Category', {
        Name: 'SystemUser',
      }).fetch((err, res) => {
        ctx.userCategoryId = res && res[0] && res[0].Id;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.create('Permission', {
        Role: ctx.roleId,
        Category: ctx.userCategoryId,
        Access: new common.Uint64('0b11111'),
      }, (err, permissionId) => {
        ctx.userCAtegoryPermission = permissionId;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      pool.query(
        'INSERT INTO "SystemUserRoles" VALUES ($1, $2)',
        [ctx.adminId, ctx.roleId],
        err => {
          cb(err);
        }
      );
    },
    // UserPerm
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.create('Role', {
        Name: 'User',
      }, (err, roleId) => {
        ctx.userRoleId = roleId;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      provider.create('Permission', {
        Role: ctx.userRoleId,
        Category: ctx.categoryId,
        Access: new common.Uint64('0b1'),
      }, (err, permissionId) => {
        ctx.permissionId = permissionId;
        cb(err);
      });
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      pool.query(
        'INSERT INTO "SystemUserRoles" VALUES ($1, $2)',
        [ctx.userId, ctx.userRoleId],
        err => {
          cb(err);
        }
      );
    },
    // End of perm
    (ctx, cb) => {
      provider[gs.selectWithId]([
        'Action',
        'Category',
        'Catalog',
        'Permission',
        'PermissionActions',
        'Role',
        'Subdivision',
        'SystemUser',
        'SystemUserRoles',
      ], (err, result) => {
        ctx.cache = result;
        cb(err);
      });
    },
    (ctx, cb) => {
      provider.cachePermissions(ctx.cache);
      userId = ctx.userId;
      cb();
    },
  ], callback);
}

prepareDB((err) => {
  if (err) {
    console.error('Cannot setup PostgresDB, exiting...');
    console.error(err);
    process.exit(1);
  }

  const api = createRemoteProviderJstpApi(provider, (provider, category, jsql) => {
    return new gs.PostgresCursor(provider, { category, jsql });
  });
  const app = new jstp.Application('console', api);

  const server = jstp.ws.createServer({
    applications: [app],
    heartbeatInterval: 5000,
  });

  const port = Number(process.argv[3] || 4000);
  server.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
});
