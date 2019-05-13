'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.generateType unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  test.strictSame(ddl.generateType('Integer', schema.domains.get('Integer')), {
    type: 'integer',
  });

  test.strictSame(
    ddl.generateType('EnumType', schema.domains.get('EnumType')),
    {
      type: '"EnumType"',
      sql: `
-- Enum: "EnumType" ------------------------------------------------------------

CREATE TYPE "EnumType" AS ENUM (
  'value1',
  'value2',
  'value3'
);`,
    }
  );

  test.strictSame(
    ddl.generateType('FlagsSmallInt', schema.domains.get('FlagsSmallInt')),
    { type: 'smallint' }
  );

  test.strictSame(
    ddl.generateType('FlagsInt', schema.domains.get('FlagsInt')),
    {
      type: 'integer',
    }
  );

  test.strictSame(
    ddl.generateType('FlagsBigInt', schema.domains.get('FlagsBigInt')),
    { type: 'bigint' }
  );

  test.strictSame(ddl.generateType('Flags16', schema.domains.get('Flags16')), {
    type: 'smallint',
  });

  test.strictSame(ddl.generateType('Flags32', schema.domains.get('Flags32')), {
    type: 'integer',
  });

  test.strictSame(ddl.generateType('Flags64', schema.domains.get('Flags64')), {
    type: 'bigint',
  });

  test.end();
});

metatests.test('pg.ddl.generateType unit test(system domains)', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load('schemas/system', options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  test.strictSame(ddl.generateType('Id', schema.domains.get('Id')), {
    type: 'bigint',
  });

  test.strictSame(ddl.generateType('Count', schema.domains.get('Count')), {
    type: 'double precision',
  });

  test.strictSame(ddl.generateType('Nomen', schema.domains.get('Nomen')), {
    type: 'text',
  });

  test.strictSame(ddl.generateType('Lambda', schema.domains.get('Lambda')), {
    type: 'text',
  });

  test.strictSame(ddl.generateType('Logical', schema.domains.get('Logical')), {
    type: 'boolean',
  });

  test.strictSame(ddl.generateType('SHA2', schema.domains.get('SHA2')), {
    type: 'bytea',
  });

  test.strictSame(ddl.generateType('Time', schema.domains.get('Time')), {
    type: 'time with time zone',
  });

  test.strictSame(ddl.generateType('DateDay', schema.domains.get('DateDay')), {
    type: 'date',
  });

  test.strictSame(
    ddl.generateType('DateTime', schema.domains.get('DateTime')),
    {
      type: 'timestamp with time zone',
    }
  );

  test.strictSame(ddl.generateType('JSON', schema.domains.get('JSON')), {
    type: 'jsonb',
  });

  test.strictSame(ddl.generateType('Money', schema.domains.get('Money')), {
    type: 'money',
  });

  test.throws(
    () => ddl.generateType('HashMap', schema.domains.get('HashMap')),
    new Error("Unsupported domain class 'HashMap' in domain 'HashMap'")
  );

  const UnsupportedDecorator = function() {};

  test.throws(
    () => ddl.generateType('UnsupportedDomain', new UnsupportedDecorator()),
    new Error('Unsupported domain: UnsupportedDomain')
  );

  test.end();
});
