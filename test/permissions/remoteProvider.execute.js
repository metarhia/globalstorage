'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, provider, args) => {
  const error = await test.rejects(provider.execute(...args), EXPECTED_ERROR);
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (test, { users, roles }) => {
  test.test(
    'public action, logged in',
    async (test, { remoteProvider, login }) => {
      const args = [null, 'PublicAction', { args: {}, context: {} }];
      const expected = 'PublicAction called';
      await login(users.S1.AdminUser);
      await test.resolves(remoteProvider.execute(...args), expected);
    }
  );

  test.test(
    'public action, not logged in',
    async (test, { remoteProvider }) => {
      const args = [null, 'PublicAction', { args: {}, context: {} }];
      const expected = 'PublicAction called';
      await test.resolves(remoteProvider.execute(...args), expected);
    }
  );

  test.test('public action, no such action', async (test, { remoteProvider }) =>
    isError(test, remoteProvider, [
      null,
      'invalidPublicAction',
      { args: {}, context: {} },
    ])
  );

  test.test(
    'category action, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const args = ['Person', 'getPersonName', { args: {}, context: {} }];
      const expected = 'getPersonName called';
      await login(users.S1.AdminUser);
      await test.resolves(remoteProvider.execute(...args), expected);
    }
  );

  test.test(
    'category action, not logged in',
    async (test, { remoteProvider }) =>
      isError(test, remoteProvider, [
        'Person',
        'getPersonName',
        { args: {}, context: {} },
      ])
  );

  test.test(
    'category action, no such system user',
    async (test, { remoteProvider, login }) => {
      await login(roles.S1.Admin);
      await isError(test, remoteProvider, [
        'Person',
        'getPersonName',
        { args: {}, context: {} },
      ]);
    }
  );

  test.test(
    'category action, blocked role',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.BlockedRoleUser);
      await isError(test, remoteProvider, [
        'Person',
        'getPersonName',
        { args: {}, context: {} },
      ]);
    }
  );

  test.test(
    'category action, no execute permission',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, [
        'Person',
        'getPersonName',
        { args: {}, context: {} },
      ]);
    }
  );

  test.test(
    'category action, no permission for category',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, remoteProvider, [
        'Locking',
        'Lock',
        { args: {}, context: {} },
      ]);
    }
  );

  test.test(
    'category action, no permission for action',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, remoteProvider, [
        'SystemUser',
        'SignUp',
        { args: {}, context: {} },
      ]);
    }
  );
};
