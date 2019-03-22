'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

module.exports = (test, { users, roles, permissions, provider }) => {
  const expectedResult = (subsystem, role, access) =>
    Object.keys(permissions[subsystem])
      .filter(name => name.startsWith(role))
      .map(name => name.replace(role, ''))
      .reduce((obj, category) => {
        obj[category] = access;
        return obj;
      }, {});

  test.test(
    'check filter categories permissions, not logged in',
    async (test, { remoteProvider }) => {
      const error = await test.rejects(
        remoteProvider.listCategoriesPermissions(),
        EXPECTED_ERROR
      );
      test.strictSame(error.code, EXPECTED_ERROR_CODE);
    }
  );

  test.test(
    'check filter categories permissions for role in subsystem S1',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.listCategoriesPermissions(),
        expectedResult('S1', 'ReadOnly', '1')
      );
    }
  );

  test.test(
    'check filter categories permissions for role in subsystem S2',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.ReadOnlyUser);
      await test.resolves(
        remoteProvider.listCategoriesPermissions(),
        expectedResult('S2', 'ReadOnly', '1')
      );
    }
  );

  test.test(
    'check filter categories permissions for role without permissions',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.GuestUser);
      await test.resolves(
        remoteProvider.listCategoriesPermissions(),
        expectedResult('S2', 'Guest')
      );
    }
  );

  test.test(
    'check filter categories permissions for user with multiple roles',
    async (test, { remoteProvider, login }) => {
      const expected = {
        ...expectedResult('S2', 'ReadOnly', '1'),
        ...expectedResult('S2', 'InsertOnly', '3'),
      };

      await login(users.S2.InsertOnlyUser);
      await provider.linkDetails(
        'SystemUser',
        'Roles',
        users.S2.InsertOnlyUser,
        roles.S2.ReadOnly
      );
      await test.resolves(remoteProvider.listCategoriesPermissions(), expected);
    }
  );
};
