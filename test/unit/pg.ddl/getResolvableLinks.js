'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.getResolvableLinks unit test');

let unresolvedLinks = new Map();
let existingLinks = [
  {
    name: 'field',
    property: { category: 'Schema2' },
    destination: 'Schema2',
  },
  {
    name: 'field',
    property: { category: 'Schema1' },
    destination: 'Schema1',
  },
  {
    name: 'field',
    property: { category: 'Schema4' },
    destination: 'Schema4',
  },
];

let expectedUnresolved = [
  {
    name: 'field',
    property: { category: 'Schema4' },
    destination: 'Schema4',
  },
];

let expectedResolvableLinks = [
  {
    from: 'Schema1',
    to: 'Schema2',
    name: 'field',
    link: { category: 'Schema2' },
    destination: 'Schema2',
  },
  {
    from: 'Schema1',
    to: 'Schema1',
    name: 'field',
    link: { category: 'Schema1' },
    destination: 'Schema1',
  },
];

test.strictSame(
  ddl.getResolvableLinks('Schema1', unresolvedLinks, existingLinks, [
    'Schema1',
    'Schema2',
  ]),
  [expectedUnresolved, expectedResolvableLinks]
);

unresolvedLinks = new Map([
  [
    'Schema2',
    [
      {
        from: 'Schema1',
        to: 'Schema2',
        name: 'field',
        link: { category: 'Schema2' },
        destination: 'Schema2',
      },
    ],
  ],
]);

existingLinks = [];
expectedUnresolved = [];

expectedResolvableLinks = [
  {
    from: 'Schema1',
    to: 'Schema2',
    name: 'field',
    link: { category: 'Schema2' },
    destination: 'Schema2',
  },
];

test.strictSame(
  ddl.getResolvableLinks('Schema2', unresolvedLinks, existingLinks, [
    'Schema1',
    'Schema2',
  ]),
  [expectedUnresolved, expectedResolvableLinks]
);

unresolvedLinks = new Map();
existingLinks = [
  {
    name: 'field',
    property: { category: 'Schema2' },
    destination: 'Schema2',
  },
];

expectedUnresolved = [];
expectedResolvableLinks = [
  {
    from: 'Schema2',
    to: 'Schema2',
    name: 'field',
    link: { category: 'Schema2' },
    destination: 'Schema2',
  },
];

test.strictSame(
  ddl.getResolvableLinks('Schema2', unresolvedLinks, existingLinks, [
    'Schema1',
  ]),
  [expectedUnresolved, expectedResolvableLinks]
);

test.end();
