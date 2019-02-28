'use strict';

const fs = require('fs');
const path = require('path');

const common = require('@metarhia/common');
const { Uint64 } = common;
const metaschema = require('metaschema');
const metasync = require('metasync');
const jstp = require('@metarhia/jstp');
const argon2 = require('argon2');
const { Pool } = require('pg');

const getPathFromCurrentDir = path.join.bind(path, __dirname);

const gs = require('.');
const { PostgresCursor } = require('./lib/pg.cursor');
const { options, config } = require('./lib/metaschema-config/config');

const {
  createRemoteProviderJstpApi,
} = require('./lib/remote.provider.jstp.api');
const { generateDDL } = require('./lib/pg.ddl');
const {
  symbols: { recreateIdTrigger, uploadCategoriesAndActions },
} = require('./lib/pg.utils');

const pgOptions = {
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD || '',
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
};

const pool = new Pool(pgOptions);
const provider = gs('pg', {
  serverSuffix: new Uint64(0x4000000),
  serverBitmask: new Uint64(0x7ffffff),
});

const isSetup = process.argv[2] === 'true';

function prepareDB(callback) {
  const queue = [
    cb => {
      metaschema.fs
        .load(
          [
            getPathFromCurrentDir('.', 'schemas'),
            // TODO add other schemas here
          ],
          {
            ...options,
            context: {
              api: {
                argon2,
                common,
                console,
                jstp,
                provider,
              },
            },
          },
          config
        )
        .then(schema => {
          provider.open({ schema, ...pgOptions }, cb);
        }, cb);
    },
  ];
  const setup = [
    (ctx, cb) => {
      fs.readFile(
        getPathFromCurrentDir('.', 'sql', 'id.sql'),
        'utf8',
        (err, initSql) => {
          ctx.initSql = initSql;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      pool.query(ctx.initSql, err => {
        cb(err);
      });
    },

    cb => {
      if (!isSetup) {
        cb();
        return;
      }
      pool.query(generateDDL(provider.schema), err => {
        cb(err);
      });
    },

    cb => {
      provider[recreateIdTrigger](1000, 30, cb);
    },

    cb => {
      provider[uploadCategoriesAndActions](cb);
    },

    (ctx, cb) => {
      provider.create(
        'Role',
        {
          Name: 'Admin',
        },
        (err, roleId) => {
          ctx.roleId = roleId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'SystemUser',
        {
          Login: 'admin',
          Password:
            '$argon2id$v=19$m=4096,t=3,p=1$+eJKoGoassU0z5WMM3T1qQ$MpAw' +
            '4mNX470PCxFbS7bGvuwGYk3hjNvngVzDJT/lM/w',
        },
        (err, userId) => {
          ctx.userId = userId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.linkDetails('SystemUser', 'Roles', ctx.userId, ctx.roleId, cb);
    },

    (ctx, cb) => {
      provider.select('Category', {}).fetch((err, res) => {
        if (err) {
          cb(err);
        } else {
          ctx.categoryIds = {};
          res.forEach(r => {
            ctx.categoryIds[r.Name] = r.Id;
          });
          cb();
        }
      });
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.SystemUser,
          Access: new Uint64('0b11111'),
        },
        (err, permissionId) => {
          ctx.permissionId = permissionId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Role,
          Access: new Uint64('0b11111'),
        },
        (err, permissionId) => {
          //ctx.permissionId = permissionId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Permission,
          Access: new Uint64('0b11111'),
        },
        (err, permissionId) => {
          //ctx.permissionId = permissionId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Category,
          Access: new Uint64('0b11111'),
        },
        (err, permissionId) => {
          //ctx.permissionId = permissionId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Person,
          Access: new Uint64('0b11111'),
        },
        cb
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Document,
          Access: new Uint64('0b11111'),
        },
        cb
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Action,
          Access: new Uint64('0b11111'),
        },
        cb
      );
    },

    (ctx, cb) => {
      provider.create(
        'Permission',
        {
          Role: ctx.roleId,
          Category: ctx.categoryIds.Log,
          Access: new Uint64('0b11111'),
        },
        cb
      );
    },

    (ctx, cb) => {
      provider.create(
        'Person',
        {
          FirstName: 'Vasia',
          LastName: 'Popov',
          //Born: new Date(),
          Documents: [],
        },
        (err, personId) => {
          ctx.personId = personId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Person',
        {
          FirstName: 'Alexandr',
          LastName: 'Popov',
          //Born: new Date(),
          Documents: [],
        },
        (err, personId) => {
          ctx.alexandrId = personId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Document',
        {
          Owner: ctx.alexandrId,
          Type: 'Passport',
          Serial: '123412412',
        },
        (err, passportId) => {
          ctx.passportId = passportId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.create(
        'Document',
        {
          Owner: ctx.alexandrId,
          Type: 'DriversLicense',
          Serial: '1234124121234324',
        },
        (err, dlId) => {
          ctx.dlId = dlId;
          cb(err);
        }
      );
    },

    (ctx, cb) => {
      provider.linkDetails(
        'Person',
        'FamilyMembers',
        ctx.personId,
        ctx.alexandrId,
        cb
      );
    },

    (ctx, cb) => {
      provider.linkDetails(
        'Person',
        'Documents',
        ctx.personId,
        ctx.passportId,
        cb
      );
    },

    (ctx, cb) => {
      provider.linkDetails(
        'Person',
        'Documents',
        ctx.alexandrId,
        ctx.dlId,
        cb
      );
    },

    (ctx, cb) => {
      provider
        .select('Action', {
          Name: 'Create',
        })
        .fetch((err, res) => {
          ctx.createId = res && res[0] && res[0].Id;
          cb(err);
        });
    },

    (ctx, cb) => {
      ctx.appIds = {};
      metasync.each(
        ['Administration', 'Users'],
        (Name, cb) => {
          provider.create('Application', { Name }, (err, id) => {
            ctx.appIds[Name] = id;
            cb(err);
          });
        },
        cb
      );
    },

    (ctx, cb) => {
      provider.linkDetails(
        'Application',
        'Categories',
        ctx.appIds.Administration,
        Object.values(ctx.categoryIds),
        cb
      );
    },

    (ctx, cb) => {
      provider.linkDetails(
        'Application',
        'Categories',
        ctx.appIds.Users,
        ctx.categoryIds.SystemUser,
        cb
      );
    },
  ];
  if (isSetup) queue.push(...setup);
  metasync.sequential(queue, callback);
}

prepareDB(err => {
  if (err) {
    console.error('Cannot setup PostgresDB, exiting...');
    console.error(err);
    process.exit(1);
  }

  const api = createRemoteProviderJstpApi(
    provider,
    (provider, category, jsql) =>
      new PostgresCursor(provider, { category, jsql })
  );
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
