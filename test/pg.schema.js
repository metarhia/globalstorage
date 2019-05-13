'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { generateDDL } = require('../lib/pg.ddl');
const { options, config } = require('../lib/metaschema-config/config');

metatests.test('Fully supports schemas/system', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load('schemas/system', options, config);
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.doesNotThrow(
    () => generateDDL(schema),
    'DDL generator must fully support current system schema'
  );
  test.end();
});

metatests.test('Unsupported domain class', async test => {
  const expectedErrorMessage =
    "Unsupported domain class '__UNSUPPORTED_CLASS__' in domain 'Test'";

  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/unsupported-domain-class',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
  test.end();
});

metatests.test('Incorrect domain definition', async test => {
  const expectedErrorMessage = 'Unsupported domain: IncorrectDomainDefinition';

  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/incorrect-domain-definition/',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
  test.end();
});

class InvalidLink {
  constructor({ category, definition }) {
    this.category = category;
    this.definition = definition;
  }
}

metatests.test('Not supported decorator', async test => {
  const expectedErrorMessage = 'InvalidLink decorator is not supported';

  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/not-supported-decorator',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  schema.categories.get('Test').definition.InvalidLink = new InvalidLink({
    category: 'Config',
    definition: schema.categories.get('Config'),
  });

  test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
  test.end();
});
