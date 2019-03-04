'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { options, config } = require('../lib/metaschema-config/config');

metatests.test('Fully supports schemas/system', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/resources',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.strictSame(schema.resources.common.get('en'), '{"Id":"Identifier"}');
  test.strictSame(schema.resources.domains.get('en'), '{"Id":"Identifier"}');
  test.strictSame(
    schema.actions.get('PublicAction').resources.get('en'),
    '{"Login":"Login"}'
  );
  test.strictSame(
    schema.categories.get('Category').resources.get('en'),
    '{"Login":"Login","Password":"Password"}'
  );
  test.strictSame(
    schema.categories
      .get('Category')
      .forms.get('Form')
      .resources.get('en'),
    '{"Login":"Login","Password":"Password"}'
  );
  test.strictSame(
    schema.categories
      .get('Category')
      .actions.get('Action')
      .resources.get('en'),
    '{"Login":"Login"}'
  );
  test.end();
});
