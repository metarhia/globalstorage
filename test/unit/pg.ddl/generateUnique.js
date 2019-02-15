'use strict';

const metatests = require('metatests');
const { options } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.generateUnique unit test');
const { Unique: createUnique } = options.localDecorators.category;

test.strictSame(
  ddl.generateUnique(
    [
      { name: 'unique1', property: { domain: 'Nomen', unique: true } },
      {
        name: 'unique3',
        property: createUnique('unique2', 'unique3'),
      },
    ],
    'Schema'
  ),
  'ALTER TABLE "Schema" ADD CONSTRAINT "akSchemaunique1" ' +
    'UNIQUE ("unique1");\n' +
    'ALTER TABLE "Schema" ADD CONSTRAINT "akSchemaunique3" ' +
    'UNIQUE ("unique2", "unique3");'
);

test.throws(
  () =>
    ddl.generateUnique(
      [
        {
          name: 'INVALID_NAME!',
          property: { domain: 'Nomen', unique: true },
        },
      ],
      'Schema'
    ),
  new Error(
    'Cannot create constraint akSchemaINVALID_NAME! ' +
      'because it is not a valid identifier'
  )
);

test.end();
