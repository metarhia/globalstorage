'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.generateId unit test');

test.strictSame(ddl.generateId('Local', 2), '"Id" bigserial');
test.strictSame(ddl.generateId('Global', 2), '"Id" bigint');

test.end();
