'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');
const { Uint64 } = require('@metarhia/common');

const { options, config } = require('../lib/metaschema-config/config');

const { ValidationError, MetaschemaError } = metaschema.errors;

metatests.test('Fully supports schemas/system', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/validate',
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
    schema.validate('category', 'Person', {
      Id: '12',
      FullName: {
        FirstName: 'Name',
        LastName: 'Surname',
      },
      Citizenship: '123',
      Parents: [new Uint64(42), new Uint64(24)],
    }),
    null
  );

  test.strictSame(
    schema.validate('category', 'Person', {
      FullName: '123',
      Citizenship: 12,
      Parents: 12,
      __Unresolved__: 'property',
    }),
    new MetaschemaError([
      new ValidationError('invalidType', 'FullName', {
        expected: 'object',
        actual: 'string',
      }),
      new ValidationError('invalidClass', 'Citizenship', {
        expected: ['Uint64', 'String'],
        actual: 'Number',
      }),
      new ValidationError('invalidType', 'Parents', {
        expected: 'Array',
        actual: 'number',
      }),
      new ValidationError('unresolvedProperty', '__Unresolved__'),
    ])
  );

  test.strictSame(schema.validate('action', 'Public', { Nomen: '12' }), null);

  test.strictSame(
    schema.validate('action', 'Public', { Nomen: 12 }),
    new MetaschemaError([
      new ValidationError('invalidType', 'Nomen', {
        expected: 'string',
        actual: 'number',
      }),
    ])
  );

  let error, value;
  [error, value] = schema.createAndValidate('category', 'Country', {
    CreationDate: new Date().toISOString(),
    AdditionalInfo: '{ "population": "4 million" }',
  });
  test.error(error);
  test.assert(value);

  [error, value] = schema.createAndValidate('category', 'Country', {
    CreationDate: new Date(),
    AdditionalInfo: { population: '4 million' },
  });
  test.error(error);
  test.assert(value);

  test.end();
});
