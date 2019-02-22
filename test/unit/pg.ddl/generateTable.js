'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.generateTable unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  test.strictSame(
    ddl.generateTable(
      'LocalCategory2',
      schema.categories.get('LocalCategory2').definition,
      'Local',
      new Map([['Nomen', 'text']]),
      new Map(),
      [],
      schema.categories
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
        schema.categories.get('Schema!').definition,
        'Local',
        new Map([['Nomen', 'text']]),
        new Map(),
        [],
        schema.categories
      ),
    new Error(
      'Cannot create table Schema! because it is not a valid identifier'
    )
  );

  test.end();
});
