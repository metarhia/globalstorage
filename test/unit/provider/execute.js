'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const {
  errors: { ValidationError },
} = metaschema;

const { StorageProvider } = require('../../../lib/provider');
const { options, config } = require('../../../lib/metaschema-config/config');
const { GSError, codes: errorCodes } = require('../../../lib/errors');

const schemasDir = join(__dirname, '../../fixtures/provider-execute');

const CATEGORY = 'Category';
const ACTION = 'Action';
const PUBLIC_ACTION = 'PublicAction';
const ACTION_ARGS = { a: 2, b: 1 };

const isError = async (
  test,
  fn,
  expectedErr = new GSError(),
  expectedErrCode = errorCodes.NOT_FOUND
) => {
  try {
    await fn();
    test.fail('must have thrown an error');
  } catch (err) {
    test.isError(err, expectedErr);
    test.strictSame(err.code, expectedErrCode);
  } finally {
    test.end();
  }
};

metatests.test('provider.execute test', test => {
  test.beforeEach(async (test, callback) => {
    let schema;

    try {
      schema = await metaschema.fs.load(schemasDir, options, config);
    } catch (err) {
      test.fail(err);
      test.end();
      return;
    }

    const provider = new StorageProvider({});

    await provider.open({ schema });
    callback({ provider });
  });

  test.endAfterSubtests();

  test.test('Permission denied', async (test, { provider }) => {
    const expectedError = new Error('Permission denied');
    const permissionChecker = () => {
      throw expectedError;
    };

    try {
      await provider.execute(
        CATEGORY,
        ACTION,
        { args: ACTION_ARGS },
        permissionChecker
      );
      test.fail('must have thrown an error');
    } catch (err) {
      test.isError(err, expectedError);
    } finally {
      test.end();
    }
  });

  test.test('No such category', (test, { provider }) =>
    isError(test, () =>
      provider.execute('InvalidCategory', ACTION, { args: ACTION_ARGS })
    )
  );

  test.test('No such category action', (test, { provider }) =>
    isError(test, () =>
      provider.execute(CATEGORY, 'InvalidAction', { args: ACTION_ARGS })
    )
  );

  test.test('No such public action', (test, { provider }) =>
    isError(test, () =>
      provider.execute(null, 'InvalidPublicAction', { args: ACTION_ARGS })
    )
  );

  test.test('Invalid arguments: unresolved property', (test, { provider }) => {
    const validationError = new ValidationError(
      'unresolvedProperty',
      'unresolvedProp'
    );
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;
    const expectedError = new GSError(
      errorCodes.INVALID_SCHEMA,
      expectedErrorMessage
    );

    isError(
      test,
      () =>
        provider.execute(CATEGORY, ACTION, {
          args: { ...ACTION_ARGS, unresolvedProp: 3 },
        }),
      expectedError,
      errorCodes.INVALID_SCHEMA
    );
  });

  test.test('Invalid arguments: missing property', (test, { provider }) => {
    const validationError = new ValidationError('missingProperty', 'b');
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;
    const expectedError = new GSError(
      errorCodes.INVALID_SCHEMA,
      expectedErrorMessage
    );

    isError(
      test,
      () => provider.execute(CATEGORY, ACTION, { args: { a: 1 } }),
      expectedError,
      errorCodes.INVALID_SCHEMA
    );
  });

  test.test('Invalid arguments: empty value', (test, { provider }) => {
    const validationError = new ValidationError('emptyValue', 'b');
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;
    const expectedError = new GSError(
      errorCodes.INVALID_SCHEMA,
      expectedErrorMessage
    );

    isError(
      test,
      () =>
        provider.execute(CATEGORY, ACTION, {
          args: { ...ACTION_ARGS, b: null },
        }),
      expectedError,
      errorCodes.INVALID_SCHEMA
    );
  });

  test.test('Invalid arguments: invalid type', (test, { provider }) => {
    const validationError = new ValidationError('invalidType', 'b', {
      expected: 'number',
      actual: 'string',
    });
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;
    const expectedError = new GSError(
      errorCodes.INVALID_SCHEMA,
      expectedErrorMessage
    );

    isError(
      test,
      () =>
        provider.execute(CATEGORY, ACTION, {
          args: { ...ACTION_ARGS, b: '2' },
        }),
      expectedError,
      errorCodes.INVALID_SCHEMA
    );
  });

  test.test('Successful category action', async (test, { provider }) => {
    const res = await provider.execute(CATEGORY, ACTION, { args: ACTION_ARGS });
    test.strictSame(res, 3);
    test.end();
  });

  test.test('Successful public action', async (test, { provider }) => {
    const res = await provider.execute(null, PUBLIC_ACTION, {
      args: ACTION_ARGS,
    });
    test.strictSame(res, 1);
    test.end();
  });
});
