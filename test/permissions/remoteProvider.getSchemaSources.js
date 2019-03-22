'use strict';

const checkSources = (test, result, expectedResult) =>
  result.forEach(source => {
    const expectedSource = expectedResult.find(
      ({ type, name, module, category }) =>
        type === source.type &&
        name === source.name &&
        module === source.module &&
        category === source.category
    );
    test.assert(expectedSource);
    test.assert(source.source);
  });

module.exports = (test, { users }) => {
  test.test(
    'check filter sources, not logged in',
    async (test, { remoteProvider }) => {
      const expectedResult = [
        {
          type: 'domains',
          name: 'gs',
          module: 'system',
        },
        {
          type: 'domains',
          name: 'system',
          module: 'system',
        },
        {
          type: 'action',
          name: 'PublicAction',
          module: 'schemas',
          category: null,
        },
      ];

      const result = await remoteProvider.getSchemaSources();
      checkSources(test, result, expectedResult);
    }
  );

  test.test(
    'check filter sources for role with permissions',
    async (test, { remoteProvider, login }) => {
      const expectedResult = [
        {
          type: 'domains',
          module: 'system',
          name: 'gs',
        },
        {
          type: 'domains',
          module: 'system',
          name: 'system',
        },
        {
          type: 'category',
          module: 'system',
          name: 'Catalog',
        },
        {
          type: 'category',
          module: 'system',
          name: 'Category',
        },
        {
          type: 'category',
          module: 'system',
          name: 'Permission',
        },
        {
          type: 'category',
          module: 'system',
          name: 'SystemUser',
        },
        {
          type: 'category',
          module: 'schemas',
          name: 'Document',
        },
        {
          type: 'category',
          module: 'schemas',
          name: 'Person',
        },
        {
          type: 'category',
          module: 'schemas',
          name: 'PersonDocument',
        },
        {
          type: 'action',
          module: 'schemas',
          name: 'PublicAction',
          category: null,
        },
      ];

      await login(users.S1.ReadOnlyUser);
      const result = await remoteProvider.getSchemaSources();
      checkSources(test, result, expectedResult);
    }
  );

  test.test(
    'check filter sources for role without permissions',
    async (test, { remoteProvider, login }) => {
      const expectedResult = [
        {
          type: 'domains',
          name: 'gs',
          module: 'system',
        },
        {
          type: 'domains',
          name: 'system',
          module: 'system',
        },
        {
          type: 'action',
          name: 'PublicAction',
          module: 'schemas',
          category: null,
        },
      ];

      await login(users.S1.GuestUser);
      const result = await remoteProvider.getSchemaSources();
      checkSources(test, result, expectedResult);
    }
  );
};
