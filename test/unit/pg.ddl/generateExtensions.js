'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.generateExtensions unit test');

test.strictSame(
  ddl.generateExtensions(['ext1', 'ext2', 'ext3']),
  'CREATE EXTENSION IF NOT EXISTS ext1;\n' +
    'CREATE EXTENSION IF NOT EXISTS ext2;\n' +
    'CREATE EXTENSION IF NOT EXISTS ext3;\n'
);

test.end();
