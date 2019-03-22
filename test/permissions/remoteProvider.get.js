'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, provider, id) => {
  const error = await test.rejects(provider.get(id), EXPECTED_ERROR);
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (
  test,
  { categories, users, roles, subsystems, catalogs, data, permissions }
) => {
  test.test('not logged in', async (test, { remoteProvider }) =>
    isError(test, remoteProvider, categories.Role)
  );

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    await login(roles.S1.Admin);
    await isError(test, remoteProvider, categories.Role);
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    await login(users.S1.BlockedRoleUser);
    await isError(test, remoteProvider, categories.Role);
  });

  test.test('no read permission', async (test, { remoteProvider, login }) => {
    await login(users.S1.InsertOnlyUser);
    await isError(test, remoteProvider, categories.Role);
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.ReadOnlyUser);
      await isError(test, remoteProvider, permissions.S2.AdminCategory);
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      const expected = {
        Id: categories.Role,
        Name: 'Role',
        Realm: 'System',
        Family: 'System',
        Version: 0,
        Master: null,
      };

      await login(users.S1.ReadOnlyUser);
      await test.resolves(remoteProvider.get(categories.Role), expected);
    }
  );

  test.test(
    'no permission for category with subsystem/category',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.ReadOnlyUser);
      await isError(test, remoteProvider, data.person.personS2);
    }
  );

  test.test(
    'no permission for subsystem',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, data.person.personS2);
    }
  );

  test.test(
    'category with subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const expected = {
        Id: data.person.personS1,
        Name: 'personS1',
        Subsystem: subsystems.S1,
      };

      await login(users.S1.ReadOnlyUser);
      await test.resolves(remoteProvider.get(data.person.personS1), expected);
    }
  );

  test.test(
    'no permission for catalog',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, data.document.documentC2);
    }
  );

  test.test(
    'category with catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const expected = {
        Id: data.document.documentC1,
        Name: 'documentC1',
        Catalog: catalogs.C1,
      };

      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.get(data.document.documentC1),
        expected
      );
    }
  );

  test.test(
    'no permission for catalog and subsystem',
    async (test, { remoteProvider, login }) => {
      await login(users.S2.ReadOnlyUser);
      await isError(
        test,
        remoteProvider,
        data.persondocument.personDocumentC1S1
      );
    }
  );

  test.test(
    'category with catalog and subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const expected = {
        Id: data.persondocument.personDocumentC1S1,
        Name: 'personDocumentC1S1',
        Subsystem: subsystems.S1,
        Catalog: catalogs.C1,
      };

      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.get(data.persondocument.personDocumentC1S1),
        expected
      );
    }
  );
};
