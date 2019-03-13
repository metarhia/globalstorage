'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { options, config } = require('../lib/metaschema-config/config');

metatests.test('Fully supports schemas/system', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/application',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }
  const app = schema.applications.get('App');
  test.strictSame(app.name, 'App');
  test.strictSame(app.definition.Categories, []);
  test.strictSame(app.definition.Menu[0].name, 'GroupName');
  test.strictSame(app.definition.Menu[0].children, ['Category', '-']);
  test.end();
});
