'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { SchemaValidationError, MetaschemaError } = metaschema.errors;
const { options, config } = require('../lib/metaschema-config/config');

metatests.test('Non-serializable functions', async test => {
  const error = await test.rejects(
    metaschema.fs.load('test/fixtures/non-serializable', options, config)
  );
  test.strictSame(
    error,
    new MetaschemaError([
      new SchemaValidationError('nonSerializable', 'test.func.parse'),
      new SchemaValidationError('nonSerializable', 'Test.Func1.check'),
      new SchemaValidationError(
        'nonSerializable',
        'Test.Action.Args.Func.check'
      ),
    ])
  );
});
