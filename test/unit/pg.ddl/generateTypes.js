'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.generateTypes unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  const actual = ddl.generateTypes(
    new Map([
      ['EnumType', schema.domains.get('EnumType')],
      ['FlagsSmallInt', schema.domains.get('FlagsSmallInt')],
      ['FlagsInt', schema.domains.get('FlagsInt')],
      ['FlagsBigInt', schema.domains.get('FlagsBigInt')],
    ])
  );

  test.strictSame(
    {
      types: Array.from(actual.types.entries()),
      typesSQL: actual.typesSQL,
    },
    {
      types: [
        ['EnumType', '"EnumType"'],
        ['FlagsSmallInt', 'smallint'],
        ['FlagsInt', 'integer'],
        ['FlagsBigInt', 'bigint'],
      ],
      typesSQL: `
-- Enum: "EnumType" ------------------------------------------------------------

CREATE TYPE "EnumType" AS ENUM (
  'value1',
  'value2',
  'value3'
);`,
    }
  );

  test.end();
});
