'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.createHistorySchema unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  const dateTime = ms.domains.get('DateTime');
  test.strictSame(ddl.createHistorySchema({}, ms.domains, ms.categories), {
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
  });

  test.end();
});
