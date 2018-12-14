'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.createEnum unit test');

test.strictSame(ddl.createEnum('__ENUM__', ['value1', 'value2', 'value3']), {
  type: '"__ENUM__"',
  sql: `
-- Enum: "__ENUM__" ------------------------------------------------------------

CREATE TYPE "__ENUM__" AS ENUM (
  'value1',
  'value2',
  'value3'
);`,
});

test.throws(
  () => ddl.createEnum(' ENUM', ['value1', 'value2', 'value3']),
  new Error('Cannot create enum  ENUM because it is not a valid identifier')
);

test.end();
