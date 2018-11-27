'use strict';

const fs = require('fs');
const path = require('path');

const common = require('@metarhia/common');
const metaschema = require('metaschema');
const metasync = require('metasync');
const metatests = require('metatests');
const { Pool } = require('pg');

const getPathFromCurrentDir = path.join.bind(path, __dirname);

const gs = require('..');
const { codes: errorCodes, GSError } = require('../lib/errors');
const { generateDDL } = require('../lib/pg.ddl');
const { pgOptions } = require('./utils');

gs.serverId = 4;
gs.serverIdBitCount = 3;
const pool = new Pool(pgOptions);
const provider = new gs.PostgresProvider(gs);

let userId;

function prepareDB(callback) {
  metasync.sequential([
    (ctx, cb) => {
      fs.readFile(
        getPathFromCurrentDir('..', 'sql', 'id.sql'),
        'utf8',
        (err, initSql) => {
          ctx.initSql = initSql;
          cb(err);
        });
    },
    (ctx, cb) => {
      pool.query(ctx.initSql, err => {
        cb(err);
      });
    },
    cb => {
      metaschema.fs.loadAndCreate([
        getPathFromCurrentDir('..', 'schemas', 'system'),
        getPathFromCurrentDir('fixtures', 'pg-test-schemas'),
      ], null, (err, schema) => {
        gs.schema = schema;
        cb(err);
      });
    },
    cb => {
      pool.query(generateDDL(gs.schema), err => {
        cb(err);
      });
    },
    cb => {
      provider.open(pgOptions, cb);
    },
    cb => {
      provider[gs.recreateIdTrigger](1000, 30, cb);
    },
    cb => {
      provider[gs.uploadCategoriesAndActions](cb);
    },
    (ctx, cb) => {
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
      provider.create('Role', {
        Name: 'Admin',
      }, (err, roleId) => {
        ctx.roleId = roleId;
        cb(err);
      });
    },
    (ctx, cb) => {
      provider.select('Category', {
        Name: 'SystemUser',
      }).fetch((err, res) => {
        ctx.categoryId = res && res[0] && res[0].Id;
        cb(err);
      });
    },
    (ctx, cb) => {
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


metatests.runner.instance.wait();

prepareDB(err => {
  metatests.runner.instance.resume();
  if (err) {
    console.error('Cannot setup PostgresDB, skipping PostgresProvider tests');
    console.error(err);
    return;
  }

  metatests.test('PostgresProvider test', test => {
    test.endAfterSubtests();

    const record = {
      category: 'Person',
      value: {
        DOB: new Date('2000-01-01'),
        Name: 'Jason',
      },
    };

    test.test('create on local category', test => {
      provider.create('LocalCategory', {
        SomeData: 'test data',
        RequiredData: 'required test data',
      }, (err, id) => {
        test.error(err);
        test.assert(id);
        test.end();
      });
    });

    test.test('invalid create on local category', test => {
      provider.create('LocalCategory', {
        SomeData: 'test data',
      }, err => {
        test.isError(err, new GSError());
        test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
        test.end();
      });
    });

    test.test('create on global category', test => {
      const { category, value } = record;
      provider.create(category, value, (err, id) => {
        test.error(err);
        test.assert(id);
        record.value.Id = id;
        test.end();
      });
    });

    test.test('invalid create on global category', test => {
      provider.create('Person', {
        DOB: new Date('1999-01-01'),
      }, err => {
        test.isError(err, new GSError());
        test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
        test.end();
      });
    });

    test.test('create on ignored category', test => {
      provider.create('TestMemory', {
        Service: 'gs',
      }, err => {
        test.isError(err, new GSError());
        test.strictSame(err.code, errorCodes.INVALID_CATEGORY_TYPE);
        test.end();
      });
    });

    test.test('gs.set', test => {
      record.value.Name = 'John';
      provider.set(record.value, err => {
        test.error(err);
        test.end();
      });
    });

    test.test('gs.get', test => {
      provider.get(record.value.Id, (err, res) => {
        test.error(err);
        test.strictSame(res, record.value);
        test.end();
      });
    });

    test.test('gs.update', test => {
      const newName = 'Peter';
      provider.update(record.category, {
        Name: record.value.Name,
      }, {
        Name: newName,
      }, (err, count) => {
        test.error(err);
        test.strictSame(count, 1);
        record.value.Name = newName;
        test.end();
      });
    });

    test.test('gs.delete', test => {
      provider.delete(record.category, {
        Name: record.value.Name,
      }, (err, count) => {
        test.error(err);
        test.strictSame(count, 1);
        test.end();
      });
    });

    test.test('gs.create with Include categories', test => {
      provider.create('Company', {
        Name: 'Metarhia',
        Address: {
          Country: 'Ukraine',
          City: 'Kiev',
        },
      }, (err, id) => {
        test.error(err);
        test.assert(id);
        test.end();
      });
    });

    test.test('gs.execute', test => {
      const session = new Map();
      session.set('Id', userId);
      provider.execute('SystemUser', 'SignIn', session, {
        Login: 'admin',
        Password: 'PaSsWoRd',
      }, (err, msg) => {
        test.error(err);
        test.strictSame(msg, 'Signed in');
        test.end();
      });
    });

    test.test('gs.execute', test => {
      const session = new Map();
      session.set('Id', userId);
      provider.execute('SystemUser', 'SignIn', session, {
        Login: 'admin',
        Password: 42,
      }, err => {
        test.strictSame(err.code, 1005);
        test.end();
      });
    });
  }, { dependentSubtests: true });

  metatests.test('PostgresProvider test', test => {
    test.endAfterSubtests();

    test.test('gs.select from category with Include', test => {
      const company = {
        Name: 'CompanyName',
        Address: {
          Country: 'Country',
          City: 'City',
        },
      };

      provider.create('Company', company, (err, id) => {
        test.error(err);
        test.assert(id);
        company.Id = id;
        company.Address.Id = id;

        provider.select('Company', { Name: company.Name }).fetch(
          (error, result) => {
            test.error(error);
            test.strictEqual(result.length, 1);
            const [selectedCompany] = result;
            test.strictSame(selectedCompany, company);
            test.end();
          }
        );
      });
    });
  });
});
