'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.pad unit test');

test.strictSame(ddl.pad('__NAME__', 18, '#'), '__NAME__##########');
test.throws(
  () => ddl.pad('__NAME__', 4),
  new RangeError('Invalid count value')
);

test.end();
