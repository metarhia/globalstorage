'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.getMaxPropLength unit test');

test.strictSame(
  ddl.getMaxPropLength([
    { name: 'prop' },
    { name: 'property' },
    { name: 'MrProper' },
  ]),
  'property'.length
);

test.end();
