'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, fn) => {
  const error = await test.rejects(fn, EXPECTED_ERROR);
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (
  test,
  { users, roles, permissions, subsystems, provider }
) => {
  test.test('not logged in', async (test, { remoteProvider }) =>
    isError(test, () =>
      remoteProvider.getDetails('SystemUser', users.S1.AdminUser, 'Roles')
    )
  );

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    await login(roles.S1.Admin);
    await isError(test, () =>
      remoteProvider.getDetails('SystemUser', users.S1.AdminUser, 'Roles')
    );
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    await login(users.S2.BlockedRoleUser);
    await isError(test, () =>
      remoteProvider.getDetails('SystemUser', users.S2.AdminUser, 'Roles')
    );
  });

  test.test('no read permission', async (test, { remoteProvider, login }) => {
    await login(users.S1.InsertOnlyUser);
    await isError(test, () =>
      remoteProvider.getDetails('SystemUser', users.S1.BlockedRoleUser, 'Roles')
    );
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.ReadOnlyUser);
      await isError(test, () =>
        remoteProvider.getDetails(
          'Permission',
          permissions.S2.ReadOnlyCategory,
          'Actions'
        )
      );
    }
  );

  test.test(
    'no permission for category in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      await isError(test, () =>
        remoteProvider.getDetails(
          'Permission',
          permissions.S1.ReadOnlyCategory,
          'Actions'
        )
      );
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await test.resolves(
        remoteProvider.getDetails(
          'Permission',
          permissions.S1.AdminCategory,
          'Actions'
        ),
        []
      );
    }
  );

  test.test(
    'category with subsystem/catalog, no record in category',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, () =>
        remoteProvider.getDetails('SystemUser', roles.S1.Admin, 'Roles')
      );
    }
  );

  test.test(
    'no permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.ReadOnlyUser);
      await isError(test, () =>
        remoteProvider.getDetails('SystemUser', users.S2.ReadOnlyUser, 'Roles')
      );
    }
  );

  test.test(
    'no permission for category with subsystem/catalog in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      const res = await remoteProvider.getDetails(
        'SystemUser',
        users.S1.ReadOnlyUser,
        'Roles'
      );
      test.assertNot(res[0]);
    }
  );

  test.test(
    'no permission for subsystem/catalog in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await provider.linkDetails(
        'SystemUser',
        'Roles',
        users.S1.GuestUser,
        roles.S2.Guest
      );
      const res = await remoteProvider.getDetails(
        'SystemUser',
        users.S1.GuestUser,
        'Roles'
      );
      const roleFromForeignSubsystem = res.find(
        ({ Subsystem }) => Subsystem === subsystems.S2
      );
      test.assertNot(roleFromForeignSubsystem);
    }
  );

  test.test(
    'no permission for subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      await isError(test, () =>
        remoteProvider.getDetails('SystemUser', users.S2.ReadOnlyUser, 'Roles')
      );
    }
  );

  test.test(
    'category with subsystem/catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const expected = [
        {
          Id: roles.S1.Admin,
          Name: 'AdminS1',
          Blocked: false,
          Subsystem: subsystems.S1,
        },
      ];

      await login(users.S1.AdminUser);
      await test.resolves(
        remoteProvider.getDetails('SystemUser', users.S1.AdminUser, 'Roles'),
        expected
      );
    }
  );
};
