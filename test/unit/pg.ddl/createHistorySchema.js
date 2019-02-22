'use strict';

const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

metatests.test('pg.ddl.createHistorySchema unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load('schemas/system', options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  const dateTime = schema.domains.get('DateTime');
  test.strictSame(
    ddl.createHistorySchema({}, schema.domains, schema.categories),
    {
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
    }
  );

  test.end();
});
