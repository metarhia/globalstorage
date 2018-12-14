'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.generateType unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  test.strictSame(ddl.generateType('Id', ms.domains.get('Id')), {
    type: 'bigint',
  });

  test.strictSame(ddl.generateType('Integer', ms.domains.get('Integer')), {
    type: 'integer',
  });

  test.strictSame(ddl.generateType('Count', ms.domains.get('Count')), {
    type: 'double precision',
  });

  test.strictSame(ddl.generateType('Nomen', ms.domains.get('Nomen')), {
    type: 'text',
  });

  test.strictSame(ddl.generateType('Lambda', ms.domains.get('Lambda')), {
    type: 'text',
  });

  test.strictSame(ddl.generateType('Logical', ms.domains.get('Logical')), {
    type: 'boolean',
  });

  test.strictSame(ddl.generateType('SHA2', ms.domains.get('SHA2')), {
    type: 'bytea',
  });

  test.strictSame(ddl.generateType('EnumType', ms.domains.get('EnumType')), {
    type: '"EnumType"',
    sql: `
-- Enum: "EnumType" ------------------------------------------------------------

CREATE TYPE "EnumType" AS ENUM (
  'value1',
  'value2',
  'value3'
);`,
  });

  test.strictSame(
    ddl.generateType('FlagsSmallInt', ms.domains.get('FlagsSmallInt')),
    { type: 'smallint' }
  );

  test.strictSame(ddl.generateType('FlagsInt', ms.domains.get('FlagsInt')), {
    type: 'integer',
  });

  test.strictSame(
    ddl.generateType('FlagsBigInt', ms.domains.get('FlagsBigInt')),
    { type: 'bigint' }
  );

  test.strictSame(ddl.generateType('Flags16', ms.domains.get('Flags16')), {
    type: 'smallint',
  });

  test.strictSame(ddl.generateType('Flags32', ms.domains.get('Flags32')), {
    type: 'integer',
  });

  test.strictSame(ddl.generateType('Flags64', ms.domains.get('Flags64')), {
    type: 'bigint',
  });

  test.strictSame(ddl.generateType('Time', ms.domains.get('Time')), {
    type: 'time with time zone',
  });

  test.strictSame(ddl.generateType('DateDay', ms.domains.get('DateDay')), {
    type: 'date',
  });

  test.strictSame(ddl.generateType('DateTime', ms.domains.get('DateTime')), {
    type: 'timestamp with time zone',
  });

  test.strictSame(ddl.generateType('JSON', ms.domains.get('JSON')), {
    type: 'jsonb',
  });

  test.strictSame(ddl.generateType('Money', ms.domains.get('Money')), {
    type: 'money',
  });

  test.throws(
    () => ddl.generateType('HashMap', ms.domains.get('HashMap')),
    new Error("Unsupported domain class 'HashMap' in domain 'HashMap'")
  );

  test.throws(
    () =>
      ddl.generateType('FlagsUnsupported', ms.domains.get('FlagsUnsupported')),
    new Error('Too many flags in FlagsUnsupported, must not be bigger than 64')
  );

  const UnsupportedDecorator = function() {};

  test.throws(
    () => ddl.generateType('UnsupportedDomain', new UnsupportedDecorator()),
    new Error('Unsupported domain: UnsupportedDomain')
  );

  test.end();
});
