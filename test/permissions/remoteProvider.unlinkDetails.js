'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, fn) => {
  const error = await test.rejects(fn, EXPECTED_ERROR);
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (test, { users, roles, permissions, actions, provider }) => {
  test.test('not logged in', async (test, { remoteProvider }) =>
    isError(test, () =>
      remoteProvider.unlinkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminDocument,
        actions.getDocumentName
      )
    )
  );

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    await login(roles.S1.Admin);
    await isError(test, () =>
      remoteProvider.unlinkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminDocument,
        actions.getDocumentName
      )
    );
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    await login(users.S1.BlockedRoleUser);
    await isError(test, () =>
      remoteProvider.unlinkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminDocument,
        actions.getDocumentName
      )
    );
  });

  test.test('no update permission', async (test, { remoteProvider, login }) => {
    await login(users.S1.InsertOnlyUser);
    await isError(test, () =>
      remoteProvider.unlinkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminDocument,
        actions.getDocumentName
      )
    );
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'Permission',
          'Actions',
          permissions.S2.AdminDocument,
          actions.getDocumentName
        )
      );
    }
  );

  test.test(
    'no read permission for category in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'Permission',
          'Actions',
          permissions.S1.AdminDocument,
          actions.getDocumentName
        )
      );
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await remoteProvider.unlinkDetails(
        'Permission',
        'Actions',
        permissions.S1.AdminPersonDocument,
        actions.getPersonDocumentName
      );
    }
  );

  test.test(
    'category with subsystem/catalog, no record in category',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'SystemUser',
          'Roles',
          roles.S1.Guest,
          roles.S1.Guest
        )
      );
    }
  );

  test.test(
    'no permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'SystemUser',
          'Roles',
          users.S2.GuestUser,
          roles.S2.Guest
        )
      );
    }
  );

  test.test(
    'no permission for subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'SystemUser',
          'Roles',
          users.S2.GuestUser,
          roles.S1.Guest
        )
      );
    }
  );

  test.test(
    'no read permission for category with subsystem/catalog in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.UpdateOnlyUser);
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'SystemUser',
          'Roles',
          users.S1.GuestUser,
          roles.S1.Guest
        )
      );
    }
  );

  test.test(
    'no read permission for subsystem/catalog in Many decorator',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.AdminUser);
      await provider.linkDetails(
        'SystemUser',
        'Roles',
        users.S2.GuestUser,
        roles.S1.Guest
      );
      await isError(test, () =>
        remoteProvider.unlinkDetails(
          'SystemUser',
          'Roles',
          users.S2.GuestUser,
          roles.S1.Guest
        )
      );
    }
  );

  test.test(
    'category with subsystem/catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.AdminUser);
      await remoteProvider.unlinkDetails(
        'SystemUser',
        'Roles',
        users.S1.GuestUser,
        roles.S1.Guest
      );
    }
  );
};
