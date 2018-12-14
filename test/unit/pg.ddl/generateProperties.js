'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.generateProperties unit test');

test.strictSame(
  ddl.generateProperties(
    'Schema1',
    [
      { name: 'field1', property: {} },
      { name: 'field2', property: { domain: 'Nomen' } },
      { name: 'field3', property: { domain: 'Nomen', required: true } },
      { name: 'field4', property: { domain: 'Nomen', default: 'value' } },
      {
        name: 'field5',
        property: { domain: 'Nomen', required: true, default: 'value' },
      },
    ],
    new Map([['Nomen', 'text']]),
    'field1'.length
  ),
  [
    '"field1" bigint',
    '"field2" text',
    '"field3" text NOT NULL',
    '"field4" text DEFAULT \'value\'',
    '"field5" text NOT NULL DEFAULT \'value\'',
  ]
);

test.end();
