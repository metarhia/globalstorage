'use strict';

const metatests = require('metatests');
const { options } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.generateIndexes unit test');
const { Index: createIndex } = options.localDecorators.category;

test.strictSame(
  ddl.generateIndexes(
    [
      { name: 'index1', property: { domain: 'Nomen', index: true } },
      { name: 'index3', property: createIndex('index2', 'index3') },
    ],
    'Schema'
  ),
  `\
CREATE INDEX "idxSchemaindex1" on "Schema" ("index1");
CREATE INDEX "idxSchemaindex3" on "Schema" ("index2", "index3");`
);

test.throws(
  () =>
    ddl.generateIndexes(
      [
        {
          name: 'INVALID_NAME!',
          property: { domain: 'Nomen', index: true },
        },
      ],
      'Schema'
    ),
  new Error(
    'Cannot create index INVALID_NAME! ' +
      'because it is not a valid identifier'
  )
);

test.end();
