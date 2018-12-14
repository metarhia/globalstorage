'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.preprocessSchema unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  const nomen = ms.domains.get('Nomen');
  const dateTime = ms.domains.get('DateTime');
  const processed = ddl.preprocessSchema(
    new Map([
      ['History', ms.categories.get('History')],
      ['Identifier', ms.categories.get('Identifier')],
    ]),
    ms.domains
  );
  const actualProcessed = Array.from(processed);
  const expectedProcessed = [
    ['History', ms.categories.get('History')],
    [
      'HistoryHistory',
      {
        name: 'HistoryHistory',
        definition: {
          field: {
            domain: 'Nomen',
            definition: nomen,
          },
          _Creation: {
            domain: 'DateTime',
            required: true,
            index: true,
            definition: dateTime,
          },
          _Effective: {
            domain: 'DateTime',
            required: true,
            index: true,
            definition: dateTime,
          },
          _Cancel: {
            domain: 'DateTime',
            index: true,
            definition: dateTime,
          },
          _HistoryStatus: {
            domain: 'HistoryStatus',
            required: true,
            definition: dateTime,
          },
          _Identifier: {
            category: 'Identifier',
            required: true,
            index: true,
            definition: ms.categories.get('Identifier').definition,
          },
        },
      },
    ],
    ['Identifier', ms.categories.get('Identifier')],
  ];

  test.strictSame(actualProcessed, expectedProcessed);

  test.end();
});
