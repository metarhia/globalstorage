'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.preprocessSchema unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  const nomen = schema.domains.get('Nomen');
  const dateTime = schema.domains.get('DateTime');
  const processed = ddl.preprocessSchema(
    new Map([
      ['History', schema.categories.get('History')],
      ['Identifier', schema.categories.get('Identifier')],
    ]),
    schema.domains
  );
  const actualProcessed = Array.from(processed);
  const expectedProcessed = [
    ['History', schema.categories.get('History')],
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
            definition: schema.categories.get('Identifier').definition,
          },
        },
      },
    ],
    ['Identifier', schema.categories.get('Identifier')],
  ];

  test.strictSame(actualProcessed, expectedProcessed);

  test.end();
});
