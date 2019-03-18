'use strict';

const fs = require('fs');
const path = require('path');

const metaschema = require('metaschema');
const metasync = require('metasync');
const metatests = require('metatests');
const { Pool } = require('pg');
const { Uint64 } = require('@metarhia/common');
const { options, config } = require('../lib/metaschema-config/config');

const getPathFromCurrentDir = path.join.bind(path, __dirname);

const gs = require('..');
const { codes: errorCodes, GSError } = require('../lib/errors');
const { generateDDL } = require('../lib/pg.ddl');
const { pgOptions } = require('./utils');
const {
  symbols: { recreateIdTrigger, uploadMetadata },
} = require('../lib/pg.utils');

const pool = new Pool(pgOptions);
const provider = gs('pg', {
  serverSuffix: new Uint64(0x4000000),
  serverBitmask: new Uint64(0x7ffffff),
});

function prepareDB(callback) {
  metasync.sequential(
    [
      (ctx, cb) => {
        fs.readFile(
          getPathFromCurrentDir('..', 'sql', 'id.sql'),
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
      (ctx, cb) => {
        metaschema.fs
          .load(
            [
              getPathFromCurrentDir('..', 'schemas', 'system'),
              getPathFromCurrentDir('fixtures', 'pg-test-schemas'),
            ],
            options,
            config
          )
          .then(schema => {
            provider.open(Object.assign({ schema }, pgOptions), cb);
          }, cb);
      },
      (ctx, cb) => {
        pool.query(generateDDL(provider.schema), err => {
          cb(err);
        });
      },
      cb => {
        provider[recreateIdTrigger](1000, 30, cb);
      },
      cb => {
        provider[uploadMetadata](cb);
      },
    ],
    callback
  );
}

metatests.runner.instance.wait();

prepareDB(err => {
  metatests.runner.instance.resume();
  if (err) {
    console.error('Cannot setup PostgresDB, skipping PostgresProvider tests');
    console.error(err);
    return;
  }

  metatests.test(
    'PostgresProvider test',
    test => {
      test.endAfterSubtests();

      const record = {
        category: 'Person',
        value: {
          DOB: new Date('2000-01-01'),
          Name: 'Jason',
        },
      };

      test.test('create on local category', test => {
        provider.create(
          'LocalCategory',
          {
            SomeData: 'test data',
            RequiredData: 'required test data',
          },
          (err, id) => {
            test.error(err);
            test.assert(id);
            test.end();
          }
        );
      });

      test.test('invalid create on local category', test => {
        provider.create(
          'LocalCategory',
          {
            SomeData: 'test data',
          },
          err => {
            test.isError(err, new GSError());
            test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
            test.end();
          }
        );
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
        provider.create(
          'Person',
          {
            DOB: new Date('1999-01-01'),
          },
          err => {
            test.isError(err, new GSError());
            test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
            test.end();
          }
        );
      });

      test.test('create on ignored category', test => {
        provider.create(
          'TestMemory',
          {
            Service: 'gs',
          },
          err => {
            test.isError(err, new GSError());
            test.strictSame(err.code, errorCodes.INVALID_CATEGORY_TYPE);
            test.end();
          }
        );
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
        provider.update(
          record.category,
          {
            Name: record.value.Name,
          },
          {
            Name: newName,
          },
          (err, count) => {
            test.error(err);
            test.strictSame(count, 1);
            record.value.Name = newName;
            test.end();
          }
        );
      });

      test.test('gs.delete', test => {
        provider.delete(
          record.category,
          {
            Name: record.value.Name,
          },
          (err, count) => {
            test.error(err);
            test.strictSame(count, 1);
            test.end();
          }
        );
      });

      const includeObj = {
        Name: 'Metarhia',
        Address: {
          Country: 'Ukraine',
          City: 'Kiev',
        },
      };

      test.test('gs.create with Include categories', test => {
        provider.create('Company', includeObj, (err, id) => {
          test.error(err);
          test.assert(id);
          includeObj.Id = id;
          test.end();
        });
      });

      test.test('gs.set with Include categories', test => {
        includeObj.Name = 'iBusiness';
        includeObj.Address = {
          Id: includeObj.Id,
          Country: 'USA',
          City: 'San Francisco',
        };
        provider.set(includeObj, err => {
          test.error(err);
          test.end();
        });
      });

      test.test('gs.get with Include categories', test => {
        provider.get(includeObj.Id, (err, obj) => {
          test.error(err);
          test.strictSame(obj, includeObj);
          test.end();
        });
      });

      test.test('gs.delete with Include categories', test => {
        provider.delete(
          'Company',
          {
            'Address.Country': includeObj.Address.Country,
          },
          (err, count) => {
            test.error(err);
            test.strictSame(count, 1);
            provider.get(includeObj.Id, err => {
              test.isError(err, new GSError());
              test.strictSame(err.code, errorCodes.NOT_FOUND);
              test.end();
            });
          }
        );
      });

      test.test('invalid gs.delete with Include categories', test => {
        provider.delete(
          'Address',
          {
            Country: includeObj.Address.Country,
          },
          err => {
            test.isError(err, new GSError());
            test.strictSame(err.code, errorCodes.INVALID_DELETION_OPERATION);
            test.end();
          }
        );
      });

      test.test('invalid gs.create with Include categories', test => {
        provider.create(
          'Address',
          {
            Country: 'France',
            City: 'Paris',
          },
          err => {
            test.isError(err, new GSError());
            test.strictSame(err.code, errorCodes.INVALID_CREATION_OPERATION);
            test.end();
          }
        );
      });
    },
    { dependentSubtests: true }
  );

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

        provider
          .select('Company', { Name: company.Name })
          .fetch((error, result) => {
            test.error(error);
            test.strictEqual(result.length, 1);
            const [selectedCompany] = result;
            test.strictSame(selectedCompany, company);
            test.end();
          });
      });
    });
  });

  metatests.test('PostgresProvider Many-to-many test', test => {
    const writer = {
      FullName: 'Douglas Adams',
      Works: [
        {
          Name: "The Hitchhiker's Guide to the Galaxy",
          PublicationYear: 1979,
        },
        {
          Name: 'The Restaurant at the End of the Universe',
          PublicationYear: 1980,
        },
        {
          Name: 'Life, the Universe and Everything',
          PublicationYear: 1982,
        },
      ],
    };

    function prepareTest(callback) {
      provider.create(
        'Writer',
        {
          FullName: writer.FullName,
        },
        (err, id) => {
          writer.Id = id;
          if (err) {
            callback(err);
            return;
          }
          metasync.each(
            writer.Works,
            (work, callback) => {
              provider.create('Work', work, (err, id) => {
                work.Id = id;
                callback(err);
              });
            },
            callback
          );
        }
      );
    }

    function runTests() {
      test.endAfterSubtests();

      const workId = writer.Works[0].Id;

      test.test('gs.linkDetails with one item', test => {
        provider.linkDetails('Writer', 'Works', writer.Id, workId, err => {
          test.error(err);
          provider.getDetails('Writer', writer.Id, 'Works', (err, works) => {
            test.error(err);
            test.strictSame(works.length, 1);
            test.strictSame(works[0], writer.Works[0]);
            test.end();
          });
        });
      });

      test.test('gs.unlinkDetails with one item', test => {
        provider.unlinkDetails('Writer', 'Works', writer.Id, workId, err => {
          test.error(err);
          provider.getDetails('Writer', writer.Id, 'Works', (err, works) => {
            test.error(err);
            test.strictSame(works.length, 0);
            test.end();
          });
        });
      });

      const worksIds = writer.Works.map(work => work.Id);

      test.test('gs.linkDetails with multiple items', test => {
        provider.linkDetails('Writer', 'Works', writer.Id, worksIds, err => {
          test.error(err);
          provider.getDetails('Writer', writer.Id, 'Works', (err, works) => {
            test.error(err);
            const sortFn = (a, b) => {
              if (a.Id > b.Id) {
                return 1;
              }
              if (a.Id < b.Id) {
                return -1;
              }
              return 0;
            };
            test.strictSame(works.sort(sortFn), writer.Works.sort(sortFn));
            test.end();
          });
        });
      });

      test.test('gs.unlinkDetails with multiple items', test => {
        provider.unlinkDetails('Writer', 'Works', writer.Id, worksIds, err => {
          test.error(err);
          provider.getDetails('Writer', writer.Id, 'Works', (err, works) => {
            test.error(err);
            test.strictSame(works.length, 0);
            test.end();
          });
        });
      });
    }

    prepareTest(() => {
      if (err) {
        test.bailout(err.stack);
      }
      runTests();
    });
  });
});
