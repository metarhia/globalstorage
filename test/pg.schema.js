'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');
const { generateDDL } = require('../lib/pg.ddl');

metatests.test('Fully supports schemas/system', test => {
  metaschema.fs.loadAndCreate('schemas/system', null, (err, schema) => {
    test.error(err, 'System schemas must be compliant with metaschema');
    test.doesNotThrow(
      () => generateDDL(schema),
      'DDL generator must fully support current system schema'
    );
    test.end();
  });
});

metatests.test('Unsupported domain class', test => {
  const expectedErrorMessage =
    "Unsupported domain class '__UNSUPPORTED_CLASS__' in domain 'Test'";

  metaschema.fs.loadAndCreate(
    'test/fixtures/unsupported-domain-class',
    null,
    (err, schema) => {
      test.error(err);
      test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
      test.end();
    }
  );
});

metatests.test('Too many flags', test => {
  const expectedErrorMessage =
    'Too many flags in ErrorFlags, must not be bigger than 64';

  metaschema.fs.loadAndCreate(
    'test/fixtures/too-many-flags/',
    null,
    (err, schema) => {
      test.error(err);
      test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
      test.end();
    }
  );
});

metatests.test('Incorrect domain definition', test => {
  const expectedErrorMessage = 'Unsupported domain: IncorrectDomainDefinition';

  metaschema.fs.loadAndCreate(
    'test/fixtures/incorrect-domain-definition/',
    null,
    (err, schema) => {
      test.error(err);
      test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
      test.end();
    }
  );
});

class InvalidLink {
  constructor({ category, definition }) {
    this.category = category;
    this.definition = definition;
  }
}

metatests.test('Not supported decorator', test => {
  const expectedErrorMessage = 'InvalidLink decorator is not supported';

  metaschema.fs.loadAndCreate(
    'test/fixtures/not-supported-decorator',
    null,
    (err, schema) => {
      test.error(err);
      schema.categories.get('Test').definition.InvalidLink = new InvalidLink({
        category: 'Config',
        definition: schema.categories.get('Config'),
      });

      test.throws(() => generateDDL(schema), new Error(expectedErrorMessage));
      test.end();
    }
  );
});
