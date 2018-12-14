'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.verticalPad unit test');

test.strictSame(ddl.verticalPad('__NAME__'), '\n\n__NAME__');
test.strictSame(ddl.verticalPad(''), '');

test.end();
