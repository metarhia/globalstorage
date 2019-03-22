'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

const isError = async (test, provider, category, query) => {
  const error = await test.rejects(
    provider.select(category, query).fetch(),
    EXPECTED_ERROR
  );
  test.strictSame(error.code, EXPECTED_ERROR_CODE);
};

module.exports = (
  test,
  { users, roles, data, catalogs, categories, subsystems }
) => {
  test.test('not logged in', async (test, { remoteProvider }) => {
    const query = { Id: catalogs.C1 };
    await isError(test, remoteProvider, 'Catalog', query);
  });

  test.test('no such system user', async (test, { remoteProvider, login }) => {
    const query = { Id: catalogs.C1 };
    await login(roles.S1.Admin);
    await isError(test, remoteProvider, 'Catalog', query);
  });

  test.test('blocked role', async (test, { remoteProvider, login }) => {
    const query = { Id: catalogs.C1 };
    await login(users.S1.BlockedRoleUser);
    await isError(test, remoteProvider, 'Catalog', query);
  });

  test.test('no read permission', async (test, { remoteProvider, login }) => {
    const query = { Id: catalogs.C1 };
    await login(users.S1.InsertOnlyUser);
    await isError(test, remoteProvider, 'Catalog', query);
  });

  test.test(
    'no permission for category',
    async (test, { remoteProvider, login }) => {
      const query = { Id: subsystems.S1 };
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, 'Subsystem', query);
    }
  );

  test.test(
    'sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = { Id: catalogs.C1 };
      const expectedResult = [
        {
          Id: catalogs.C1,
          Caption: 'C1',
          Category: categories.Document,
          Parent: null,
        },
      ];

      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.select('Catalog', query).fetch(),
        expectedResult
      );
    }
  );

  test.test(
    'no read permission for category with subsystem/catalog',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS2, Subsystem: subsystems.S2 };
      await login(users.S1.InsertOnlyUser);
      await isError(test, remoteProvider, 'Person', query);
    }
  );

  test.test(
    'no subsystem in query',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS1 };
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, 'Person', query);
    }
  );

  test.test('no catalog in query', async (test, { remoteProvider, login }) => {
    const query = { Id: data.document.documentC1 };
    await login(users.S1.ReadOnlyUser);
    await isError(test, remoteProvider, 'Document', query);
  });

  test.test(
    'no permission for subsystem',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS2, Subsystem: subsystems.S2 };
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, 'Person', query);
    }
  );

  test.test(
    'category with subsystem, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.person.personS1, Subsystem: subsystems.S1 };
      const expectedResult = [
        {
          Id: data.person.personS1,
          Name: 'personS1',
          Subsystem: subsystems.S1,
        },
      ];

      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.select('Person', query).fetch(),
        expectedResult
      );
    }
  );

  test.test(
    'no permission for catalog',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.document.documentC2, Catalog: catalogs.C2 };
      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, 'Document', query);
    }
  );

  test.test(
    'category with catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = { Id: data.document.documentC1, Catalog: catalogs.C1 };
      const expectedResult = [
        {
          Id: data.document.documentC1,
          Name: 'documentC1',
          Catalog: catalogs.C1,
        },
      ];

      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.select('Document', query).fetch(),
        expectedResult
      );
    }
  );

  test.test(
    'no read permission for subsystem and catalog',
    async (test, { remoteProvider, login }) => {
      const query = {
        Catalog: catalogs.C2,
        Subsystem: subsystems.S2,
      };

      await login(users.S1.ReadOnlyUser);
      await isError(test, remoteProvider, 'PersonDocument', query);
    }
  );

  test.test(
    'category with subsystem and catalog, sufficient permission',
    async (test, { remoteProvider, login }) => {
      const query = {
        Id: data.persondocument.personDocumentC1S1,
        Catalog: catalogs.C1,
        Subsystem: subsystems.S1,
      };
      const expectedResult = [
        {
          Id: data.persondocument.personDocumentC1S1,
          Name: 'personDocumentC1S1',
          Subsystem: subsystems.S1,
          Catalog: catalogs.C1,
        },
      ];

      await login(users.S1.ReadOnlyUser);
      await test.resolves(
        remoteProvider.select('PersonDocument', query).fetch(),
        expectedResult
      );
    }
  );
};
