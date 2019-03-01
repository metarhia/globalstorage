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

  try {
    test.strictSame(schema.validate('domains', 'JSON', {}), null);
    test.strictSame(schema.validate('domains', 'JSON', { a: 2 }), null);
    test.strictSame(schema.validate('domains', 'JSON', '3'), null);

    const a = { b: 42 };
    a.a = a;

    test.strictSame(
      schema.validate('domains', 'JSON', a, { path: 'a' }),
      new MetaschemaError([
        new ValidationError('invalidInstance', 'a', { type: 'JSON' }),
      ])
    );

    test.strictSame(schema.validate('domains', 'Date', 0), null);
    test.strictSame(schema.validate('domains', 'Date', new Date()), null);
    test.strictSame(schema.validate('domains', 'Date', '1970-01-01'), null);

    test.strictSame(
      schema.validate('domains', 'Date', '__INVALID_DATE__', { path: 'date' }),
      new MetaschemaError([
        new ValidationError('invalidInstance', 'date', { type: 'Date' }),
      ])
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
  }

  test.end();
});
