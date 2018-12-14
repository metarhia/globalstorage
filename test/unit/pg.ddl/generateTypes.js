'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.generateTypes unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  const actual = ddl.generateTypes(
    new Map([
      ['EnumType', ms.domains.get('EnumType')],
      ['Day', ms.domains.get('Day')],
      ['FlagsSmallInt', ms.domains.get('FlagsSmallInt')],
      ['FlagsInt', ms.domains.get('FlagsInt')],
      ['FlagsBigInt', ms.domains.get('FlagsBigInt')],
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
        ['Day', '"Day"'],
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
);

-- Enum: "Day" -----------------------------------------------------------------

CREATE TYPE "Day" AS ENUM (
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
);`,
    }
  );

  test.end();
});
