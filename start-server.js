'use strict';

const fs = require('fs');
const path = require('path');

const common = require('@metarhia/common');
const metaschema = require('metaschema');
const metasync = require('metasync');
const metatests = require('metatests');
const jstp = require('@metarhia/jstp');
const { Pool } = require('pg');

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
        // TODO add other schemas here
      ], null, (err, schema) => {
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
      provider.create('SystemUser', {
        Login: 'admin',
        Password: '$argon2id$v=19$m=4096,t=3,p=1$S1xPG8hsOCYip1dKOkjVYQ$ItOI' +
          'LC/Hc97nR2d/Ocq5pNAFOWM0QZv06Em10EiRevE',
      }, (err, userId) => {
        ctx.userId = userId;
        cb(err);
      });
    },
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
        Name: 'SystemUser',
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
      pool.query(
        'INSERT INTO "PermissionActions"' +
        ' SELECT $1, "Id" FROM "Action" WHERE "Name" = \'SignIn\'',
        [ctx.permissionId],
        err => {
          cb(err);
        }
      );
    },
    (ctx, cb) => {
      if (!isSetup) {
        cb();
        return;
      }
      pool.query(
        'INSERT INTO "SystemUserRoles" VALUES ($1, $2)',
        [ctx.userId, ctx.roleId],
        err => {
          cb(err);
        }
      );
    },
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
    return new gs.PostgresCursor(provider.pool, { category, jsql });
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
