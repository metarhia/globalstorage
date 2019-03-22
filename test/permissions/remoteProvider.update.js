'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, provider, category, query, patch) => {
  const error = await test.rejects(
    provider.update(category, query, patch),
    EXPECTED_ERROR
  );
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (test, { users, roles, data, catalogs, subsystems }) => {
  test.test('not logged in', async (test, { remoteProvider }) => {
    const query = { Id: catalogs.C1 };
    const patch = { Caption: 'C1' };

    await isError(test, remoteProvider, 'Catalog', query, patch);
  });

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    const query = { Id: catalogs.C1 };
    const patch = { Caption: 'C1' };

    await login(roles.S1.Admin);
    await isError(test, remoteProvider, 'Catalog', query, patch);
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    const query = { Id: catalogs.C1 };
    const patch = { Caption: 'C1' };

    await login(users.S1.BlockedRoleUser);
    await isError(test, remoteProvider, 'Catalog', query, patch);
  });

  test.test('no update permission', async (test, { remoteProvider, login }) => {
    const query = { Id: catalogs.C1 };
    const patch = { Caption: 'C1' };

    await login(users.S1.ReadOnlyUser);
    await isError(test, remoteProvider, 'Catalog', query, patch);
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      const query = { Id: subsystems.S1 };
      const patch = { Name: 'S1' };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Subsystem', query, patch);
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = { Id: catalogs.C1 };
      const patch = { Caption: 'C1' };

      await login(users.S1.UpdateOnlyUser);
      await test.resolves(remoteProvider.update('Catalog', query, patch), 1);
    }
  );

  test.test(
    'no permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS2, Subsystem: subsystems.S2 };
      const patch = { Name: 'personS2' };

      await login(users.S2.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Person', query, patch);
    }
  );

  test.test(
    'no subsystem in query',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS1 };
      const patch = { Name: 'personS1' };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Person', query, patch);
    }
  );

  test.test('no catalog in query', async (test, { remoteProvider, login }) => {
    const query = { Id: data.document.documentC1 };
    const patch = { Name: 'documentC1' };

    await login(users.S1.UpdateOnlyUser);
    await isError(test, remoteProvider, 'Document', query, patch);
  });

  test.test(
    'no permission for patching data from foreign subsystem',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS1 };
      const patch = { Subsystem: subsystems.S2 };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Person', query, patch);
    }
  );

  test.test(
    'no permission for patching data from foreign catalog',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.document.documentC1 };
      const patch = { Catalog: catalogs.C2 };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Document', query, patch);
    }
  );

  test.test(
    'no permission for subsystem',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS2, Subsystem: subsystems.S2 };
      const patch = { Name: 'personS2' };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Person', query, patch);
    }
  );

  test.test(
    'category with subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS1, Subsystem: subsystems.S1 };
      const patch = { Name: 'personS1' };

      await login(users.S1.UpdateOnlyUser);
      await test.resolves(remoteProvider.update('Person', query, patch), 1);
    }
  );

  test.test(
    'no permission for catalog',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.document.documentC2, Catalog: catalogs.C2 };
      const patch = { Name: 'documentC2' };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'Document', query, patch);
    }
  );

  test.test(
    'category with catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.document.documentC1, Catalog: catalogs.C1 };
      const patch = { Name: 'documentC1' };

      await login(users.S1.UpdateOnlyUser);
      await test.resolves(remoteProvider.update('Document', query, patch), 1);
    }
  );

  test.test(
    'no permission for subsystem and catalog',
    async (test, { remoteProvider, login }) => {
      const query = {
        Id: data.persondocument.personDocumentC2S2,
        Catalog: catalogs.C2,
        Subsystem: subsystems.S2,
      };
      const patch = { Name: 'personDocumentC2S2' };

      await login(users.S1.UpdateOnlyUser);
      await isError(test, remoteProvider, 'PersonDocument', query, patch);
    }
  );

  test.test(
    'category with subsystem and catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = {
        Id: data.persondocument.personDocumentC2S2,
        Catalog: catalogs.C2,
        Subsystem: subsystems.S2,
      };
      const patch = { Name: 'personDocumentC2S2' };

      await login(users.S2.UpdateOnlyUser);
      await test.resolves(
        remoteProvider.update('PersonDocument', query, patch),
        1
      );
    }
  );
};
