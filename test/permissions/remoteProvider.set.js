'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, provider, query) => {
  const error = await test.rejects(provider.set(query), EXPECTED_ERROR);
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (
  test,
  { categories, users, roles, data, catalogs, subsystems }
) => {
  test.test('not logged in', async (test, { remoteProvider }) => {
    const record = {
      Caption: 'C1',
      Id: catalogs.C1,
      Category: categories.Document,
    };

    await isError(test, remoteProvider, record);
  });

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    const record = {
      Caption: 'C1',
      Id: catalogs.C1,
      Category: categories.Document,
    };

    await login(roles.S1.Admin);
    await isError(test, remoteProvider, record);
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    const record = {
      Caption: 'C1',
      Id: catalogs.C1,
      Category: categories.Document,
    };

    await login(users.S1.BlockedRoleUser);
    await isError(test, remoteProvider, record);
  });

  test.test('no update permission', async (test, { remoteProvider, login }) => {
    const record = {
      Caption: 'C1',
      Id: catalogs.C1,
      Category: categories.Document,
    };

    await login(users.S1.ReadOnlyUser);
    await isError(test, remoteProvider, record);
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      const record = {
        Code: 0,
        Name: 'S1',
        Id: subsystems.S1,
        SystemType: 'Autonomous',
      };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Caption: 'C1',
        Id: catalogs.C1,
        Category: categories.Document,
      };

      await login(users.S1.UpdateOnlyUser);
      await test.resolves(remoteProvider.set(record));
    }
  );

  test.test(
    'no permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personS2',
        Id: data.person.personS2,
        Subsystem: subsystems.S2,
      };

      await login(users.S2.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'no permission for setting data from foreign subsystem',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personS2',
        Id: data.person.personS1,
        Subsystem: subsystems.S2,
      };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'no permission for setting data from foreign catalog',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'documentC2',
        Id: data.document.documentC1,
        Catalog: catalogs.C2,
      };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'no permission for subsystem',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personS2',
        Id: data.person.personS2,
        Subsystem: subsystems.S2,
      };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'category with subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personS1',
        Id: data.person.personS1,
        Subsystem: subsystems.S1,
      };

      await login(users.S1.UpdateOnlyUser);
      await test.resolves(remoteProvider.set(record));
    }
  );

  test.test(
    'no permission for catalog',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'documentC2',
        Id: data.document.documentC2,
        Catalog: catalogs.C2,
      };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'category with catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'documentC1',
        Id: data.document.documentC1,
        Catalog: catalogs.C1,
      };

      await login(users.S1.UpdateOnlyUser);
      await test.resolves(remoteProvider.set(record));
    }
  );

  test.test(
    'no permission for subsystem and catalog',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personDocumentC2S2',
        Id: data.persondocument.personDocumentC2S2,
        Catalog: catalogs.C2,
        Subsystem: subsystems.S2,
      };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, record);
    }
  );

  test.test(
    'category with subsystem and catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personDocumentC2S2',
        Id: data.persondocument.personDocumentC2S2,
        Catalog: catalogs.C2,
        Subsystem: subsystems.S2,
      };

      await login(users.S2.UpdateOnlyUser);
      await test.resolves(remoteProvider.set(record));
    }
  );
};
