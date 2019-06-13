'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

module.exports = (test, { users, permissions }) => {
  const expectedResult = (subsystem, role) =>
    Object.keys(permissions[subsystem])
      .filter(name => name.startsWith(role))
      .map(name => name.replace(role, ''))
      .sort();

  test.test(
    'check filter categories, not logged in',
    async (test, { remoteProvider }) => {
      const error = await test.rejects(
        remoteProvider.listCategories(),
        EXPECTED_ERROR
      );
      test.strictSame(error.code, EXPECTED_ERROR_CODE);
    }
  );

  test.test(
    'check filter categories for role in subsystem S1',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await test.resolves(
        remoteProvider.listCategories().then(res => res.sort()),
        expectedResult('S1', 'Admin')
      );
    }
  );

  test.test(
    'check filter categories for role in subsystem S2',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.AdminUser);
      await test.resolves(
        remoteProvider.listCategories().then(res => res.sort()),
        expectedResult('S2', 'Admin')
      );
    }
  );

  test.test(
    'check filter categories for role without permissions',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.GuestUser);
      await test.resolves(
        remoteProvider.listCategories().then(res => res.sort()),
        expectedResult('S2', 'Guest')
      );
    }
  );
};
