'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { generateDDL } = require('../lib/pg.ddl');
const { options, config } = require('../lib/metaschema-config/config');

metatests.test('Fully supports schemas/system', async test => {
  let errors;
  let schema;

  try {
    [errors, schema] = await metaschema.fs.load(
      'schemas/system',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.strictSame(
    errors,
    [],
    'System schemas must be compliant with metaschema config'
  );
  test.doesNotThrow(
    () => generateDDL(schema),
    'DDL generator must fully support current system schema'
  );
  test.end();
});

metatests.test('Unsupported domain class', async test => {
  const expectedErrorMessage =
    "Unsupported domain class '__UNSUPPORTED_CLASS__' in domain 'Test'";

  let errors;
  let schema;

  try {
    [errors, schema] = await metaschema.fs.load(
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

  test.strictSame(
    errors,
    [],
    'System schemas must be compliant with metaschema config'
  );

  test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
  test.end();
});

metatests.test('Too many flags', async test => {
  const expectedErrorMessage =
    'Too many flags in ErrorFlags, must not be bigger than 64';

  let errors;
  let schema;

  try {
    [errors, schema] = await metaschema.fs.load(
      'test/fixtures/too-many-flags',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.strictSame(
    errors,
    [],
    'System schemas must be compliant with metaschema config'
  );

  test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
  test.end();
});

metatests.test('Incorrect domain definition', async test => {
  const expectedErrorMessage = 'Unsupported domain: IncorrectDomainDefinition';

  let errors;
  let schema;

  try {
    [errors, schema] = await metaschema.fs.load(
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

  test.strictSame(
    errors,
    [],
    'System schemas must be compliant with metaschema config'
  );

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

  let errors;
  let schema;

  try {
    [errors, schema] = await metaschema.fs.load(
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

  test.strictSame(
    errors,
    [],
    'System schemas must be compliant with metaschema config'
  );

  schema.categories.get('Test').definition.InvalidLink = new InvalidLink({
    category: 'Config',
    definition: schema.categories.get('Config'),
  });

  test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
  test.end();
});
