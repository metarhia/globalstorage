'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.generateTable unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  test.strictSame(
    ddl.generateTable(
      'LocalCategory2',
      ms.categories.get('LocalCategory2').definition,
      'Local',
      new Map([['Nomen', 'text']]),
      new Map(),
      [],
      ms.categories
    ),
    {
      sql:
        '\n' +
        '-- Category: LocalCategory2 ----------------------------------------' +
        '------------\n' +
        '\n' +
        'CREATE TABLE "LocalCategory2" (\n' +
        '  "Id"    bigserial,\n' +
        '  "field" bigint\n' +
        ');\n' +
        '\n' +
        'ALTER TABLE "LocalCategory2" ADD CONSTRAINT "pkLocalCategory2Id" ' +
        'PRIMARY KEY ("Id");',
      unresolved: [
        {
          name: 'field',
          property: {
            category: 'LocalCategory1',
            definition: {
              field: {
                domain: 'Nomen',
                definition: { type: 'string', length: 60 },
              },
            },
          },
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
    }
  );

  test.throws(
    () =>
      ddl.generateTable(
        'Schema!',
        ms.categories.get('Schema!').definition,
        'Local',
        new Map([['Nomen', 'text']]),
        new Map(),
        [],
        ms.categories
      ),
    new Error(
      'Cannot create table Schema! because it is not a valid identifier'
    )
  );

  test.end();
});
