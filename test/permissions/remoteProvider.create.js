'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, provider, category, record) => {
  const error = await test.rejects(
    provider.create(category, record),
    EXPECTED_ERROR
  );
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (test, { categories, users, roles, catalogs, subsystems }) => {
  test.test('not logged in', async (test, { remoteProvider }) => {
    const record = {
      Caption: 'C4',
      Category: categories.Document,
    };

    await isError(test, remoteProvider, 'Catalog', record);
  });

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    const record = {
      Caption: 'C4',
      Category: categories.Document,
    };

    await login(roles.S1.Admin);
    await isError(test, remoteProvider, 'Catalog', record);
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    const record = {
      Caption: 'C4',
      Category: categories.Document,
    };

    await login(users.S1.BlockedRoleUser);
    await isError(test, remoteProvider, 'Catalog', record);
  });

  test.test('no insert permission', async (test, { remoteProvider, login }) => {
    const record = {
      Caption: 'C4',
      Category: categories.Document,
    };

    await login(users.S1.UpdateOnlyUser);
    await isError(test, remoteProvider, 'Catalog', record);
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      const record = {
        Caption: 'C4',
        Category: categories.Document,
      };

      await login(users.S2.InsertOnlyUser);
      await isError(test, remoteProvider, 'Catalog', record);
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Caption: 'C4',
        Category: categories.Document,
      };

      await login(users.S1.InsertOnlyUser);
      await test.resolves(async () => {
        await remoteProvider.create('Catalog', record);
      });
    }
  );

  test.test(
    'no permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'person2S2',
        Subsystem: subsystems.S2,
      };

      await login(users.S2.InsertOnlyUser);
      await isError(test, remoteProvider, 'Person', record);
    }
  );

  test.test(
    'no permission for subsystem',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'person2S2',
        Subsystem: subsystems.S2,
      };

      await login(users.S1.InsertOnlyUser);
      await isError(test, remoteProvider, 'Person', record);
    }
  );

  test.test(
    'category with subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'person3S1',
        Subsystem: subsystems.S1,
      };

      await login(users.S1.InsertOnlyUser);
      await test.resolves(async () => {
        await remoteProvider.create('Person', record);
      });
    }
  );

  test.test(
    'no permission for catalog',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'document2C2',
        Catalog: catalogs.C2,
      };

      await login(users.S1.InsertOnlyUser);
      await isError(test, remoteProvider, 'Document', record);
    }
  );

  test.test(
    'category with catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'document3C1',
        Catalog: catalogs.C1,
      };

      await login(users.S1.InsertOnlyUser);
      await test.resolves(async () => {
        await remoteProvider.create('Document', record);
      });
    }
  );

  test.test(
    'no permission for catalog and subsystem',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personDocument2C1S2',
        Catalog: catalogs.C1,
        Subsystem: subsystems.S2,
      };

      await login(users.S1.InsertOnlyUser);
      await isError(test, remoteProvider, 'PersonDocument', record);
    }
  );

  test.test(
    'category with catalog and subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const record = {
        Name: 'personDocumentC2S1',
        Catalog: catalogs.C2,
        Subsystem: subsystems.S1,
      };

      await login(users.S1.InsertOnlyUser);
      await test.resolves(async () => {
        await remoteProvider.create('PersonDocument', record);
      });
    }
  );
};
