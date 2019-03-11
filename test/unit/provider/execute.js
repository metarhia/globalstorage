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

    provider.open({ schema }, test.cbFail(() => callback({ provider })));
  });

  test.endAfterSubtests();

  test.test('Permission denied', (test, { provider }) => {
    const expectedError = new Error('Permission denied');
    const permissionChecker = (category, action, callback) =>
      callback(expectedError);

    provider.execute(
      CATEGORY,
      ACTION,
      [null, ACTION_ARGS],
      err => {
        test.isError(err, expectedError);
        test.end();
      },
      permissionChecker
    );
  });

  test.test('No such category', (test, { provider }) =>
    provider.execute('InvalidCategory', ACTION, [null, ACTION_ARGS], err => {
      test.isError(err, new GSError());
      test.strictSame(err.code, errorCodes.NOT_FOUND);
      test.end();
    })
  );

  test.test('No such category action', (test, { provider }) =>
    provider.execute(CATEGORY, 'InvalidAction', [null, ACTION_ARGS], err => {
      test.isError(err, new GSError());
      test.strictSame(err.code, errorCodes.NOT_FOUND);
      test.end();
    })
  );

  test.test('No such public action', (test, { provider }) =>
    provider.execute(null, 'InvalidPublicAction', [null, ACTION_ARGS], err => {
      test.isError(err, new GSError());
      test.strictSame(err.code, errorCodes.NOT_FOUND);
      test.end();
    })
  );

  test.test('Invalid arguments: unresolved property', (test, { provider }) => {
    const validationError = new ValidationError(
      'unresolvedProperty',
      'unresolvedProp'
    );
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;

    provider.execute(
      CATEGORY,
      ACTION,
      [null, { ...ACTION_ARGS, unresolvedProp: 3 }],
      err => {
        test.isError(
          err,
          new GSError(errorCodes.INVALID_SCHEMA, expectedErrorMessage)
        );
        test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
        test.end();
      }
    );
  });

  test.test('Invalid arguments: missing property', (test, { provider }) => {
    const validationError = new ValidationError('missingProperty', 'b');
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;

    provider.execute(CATEGORY, ACTION, [null, { a: 1 }], err => {
      test.isError(
        err,
        new GSError(errorCodes.INVALID_SCHEMA, expectedErrorMessage)
      );
      test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
      test.end();
    });
  });

  test.test('Invalid arguments: empty value', (test, { provider }) => {
    const validationError = new ValidationError('emptyValue', 'b');
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;

    provider.execute(
      CATEGORY,
      ACTION,
      [null, { ...ACTION_ARGS, b: null }],
      err => {
        test.isError(
          err,
          new GSError(errorCodes.INVALID_SCHEMA, expectedErrorMessage)
        );
        test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
        test.end();
      }
    );
  });

  test.test('Invalid arguments: invalid type', (test, { provider }) => {
    const validationError = new ValidationError('invalidType', 'b', {
      expected: 'number',
      actual: 'string',
    });
    const expectedErrorMessage = `Invalid arguments provided: ${validationError}`;

    provider.execute(
      CATEGORY,
      ACTION,
      [null, { ...ACTION_ARGS, b: '2' }],
      err => {
        test.isError(
          err,
          new GSError(errorCodes.INVALID_SCHEMA, expectedErrorMessage)
        );
        test.strictSame(err.code, errorCodes.INVALID_SCHEMA);
        test.end();
      }
    );
  });

  test.test('Successful category action', (test, { provider }) =>
    provider.execute(CATEGORY, ACTION, [null, ACTION_ARGS], (err, res) => {
      test.error(err);
      test.strictSame(res, 3);
      test.end();
    })
  );

  test.test('Successful public action', (test, { provider }) =>
    provider.execute(null, PUBLIC_ACTION, [null, ACTION_ARGS], (err, res) => {
      test.error(err);
      test.strictSame(res, 1);
      test.end();
    })
  );
});
