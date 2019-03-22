'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, fn) => {
  const error = await test.rejects(fn, EXPECTED_ERROR);
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (test, { users, roles, permissions, actions }) => {
  test.test('not logged in', async (test, { remoteProvider }) =>
    isError(test, () =>
      remoteProvider.linkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminSystemUser,
        actions.SignIn
      )
    )
  );

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    await login(roles.S1.Admin);
    await isError(test, () =>
      remoteProvider.linkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminSystemUser,
        actions.SignIn
      )
    );
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    await login(roles.S2.BlockedRoleUser);
    await isError(test, () =>
      remoteProvider.linkDetails(
        'Permission',
        'Actions',
        permissions.S2.AdminSystemUser,
        actions.SignIn
      )
    );
  });

  test.test('no update permission', async (test, { remoteProvider, login }) => {
    await login(users.S1.InserOnlyUser);
    await isError(test, () =>
      remoteProvider.linkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminSystemUser,
        actions.SignIn
      )
    );
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'Permission',
          'Actions',
          permissions.S2.AdminSystemUser,
          actions.SignIn
        )
      );
    }
  );

  test.test(
    'no read permission for category in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'Permission',
          'Actions',
          permissions.S1.AdminSystemUser,
          actions.SignIn
        )
      );
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.AdminUser);
      await remoteProvider.linkDetails(
        'Permission',
        'Actions',
        permissions.S2.AdminSystemUser,
        actions.SignOut
      );
    }
  );

  test.test(
    'category with subsystem/catalog, no record in category',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'SystemUser',
          'Roles',
          roles.S1.Guest,
          roles.S1.ReadOnly
        )
      );
    }
  );

  test.test(
    'no permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'SystemUser',
          'Roles',
          users.S2.GuestUser,
          roles.S2.ReadOnly
        )
      );
    }
  );

  test.test(
    'no permission for subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'SystemUser',
          'Roles',
          users.S2.GuestUser,
          roles.S1.ReadOnly
        )
      );
    }
  );

  test.test(
    'no read permission for category with subsystem/catalog in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'SystemUser',
          'Roles',
          users.S1.GuestUser,
          roles.S1.InsertOnly
        )
      );
    }
  );

  test.test(
    'no read permission for subsystem/catalog in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, () =>
        remoteProvider.linkDetails(
          'SystemUser',
          'Roles',
          users.S1.GuestUser,
          roles.S2.ReadOnly
        )
      );
    }
  );

  test.test(
    'category with subsystem/catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await remoteProvider.linkDetails(
        'SystemUser',
        'Roles',
        users.S1.GuestUser,
        roles.S1.ReadOnly
      );
    }
  );
};
