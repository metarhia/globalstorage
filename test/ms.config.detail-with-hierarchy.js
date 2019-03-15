'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { options, config } = require('../lib/metaschema-config/config');

const { SchemaValidationError, MetaschemaError } = metaschema.errors;

metatests.test('Fully supports schemas/system', async test => {
  try {
    await metaschema.fs.load(
      'test/fixtures/detail-with-hierarchy',
      options,
      config
    );
  } catch (error) {
    test.strictSame(
      error,
      new MetaschemaError([
        new SchemaValidationError('detailHierarchy', 'Detail', {
          type: 'Subsystem',
          master: 'Master',
        }),
        new SchemaValidationError('detailHierarchy', 'Included', {
          type: 'Catalog',
          master: 'Master',
        }),
      ])
    );
    test.end();
    return;
  }

  test.fail('Expected to fail');
  test.end();
});
