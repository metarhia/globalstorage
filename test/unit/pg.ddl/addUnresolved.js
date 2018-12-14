'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.addUnresolved unit test');

const unresolved = new Map([
  [
    'Schema1',
    [
      {
        name: 'field',
        property: { category: 'Schema1' },
        destination: 'Schema1',
      },
    ],
  ],
]);

ddl.addUnresolved(
  [
    {
      name: 'field',
      property: { category: 'Schema1' },
      destination: 'Schema1',
    },
  ],
  unresolved,
  'Schema2'
);

let actualUnresolved = Array.from(unresolved.entries());
let expectedUnresolved = [
  [
    'Schema1',
    [
      {
        name: 'field',
        property: { category: 'Schema1' },
        destination: 'Schema1',
      },
      {
        from: 'Schema2',
        to: 'Schema1',
        name: 'field',
        link: { category: 'Schema1' },
        destination: 'Schema1',
      },
    ],
  ],
];

test.strictSame(actualUnresolved, expectedUnresolved);

unresolved.clear();

ddl.addUnresolved(
  [
    {
      name: 'field',
      property: { category: 'Schema1' },
      destination: 'Schema1',
    },
  ],
  unresolved,
  'Schema2'
);

actualUnresolved = Array.from(unresolved.entries());
expectedUnresolved = [
  [
    'Schema1',
    [
      {
        from: 'Schema2',
        to: 'Schema1',
        name: 'field',
        link: { category: 'Schema1' },
        destination: 'Schema1',
      },
    ],
  ],
];

test.strictSame(actualUnresolved, expectedUnresolved);

test.end();
