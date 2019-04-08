'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { options, config } = require('../lib/metaschema-config/config');

const { MetaschemaError, SchemaValidationError } = metaschema.errors;

metatests.test('Fully supports schemas/system', async test => {
  try {
    await metaschema.fs.load(
      'test/fixtures/owned-public-action',
      options,
      config
    );
    test.fail('Schema loading must fail');
  } catch (error) {
    test.strictSame(
      error,
      new MetaschemaError([
        new SchemaValidationError('ownedPublic', 'Category.Action', {
          type: 'action',
        }),
      ])
    );
  }
  test.end();
});
