'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.createComment unit test');

test.strictSame(
  ddl.createComment('__COMMENT__'),
  `
-- __COMMENT__ -----------------------------------------------------------------

`
);

test.end();
