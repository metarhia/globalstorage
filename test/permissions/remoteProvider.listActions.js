'use strict';

module.exports = (test, { users }) => {
  test.test(
    'check filter actions, not logged in',
    async (test, { remoteProvider }) => {
      const expectedResult = { public: ['PublicAction'] };
      await test.resolves(remoteProvider.listActions(), expectedResult);
    }
  );

  test.test(
    'check filter actions for role with linked actions and permissions',
    async (test, { remoteProvider, login }) => {
      const expectedResult = {
        public: ['PublicAction'],
        private: {
          Document: ['getDocumentName'],
          Person: ['getPersonName'],
          PersonDocument: ['getPersonDocumentName'],
        },
      };

      await login(users.S1.AdminUser);
      await test.resolves(remoteProvider.listActions(), expectedResult);
    }
  );

  test.test(
    'check filter actions for role without linked actions and permissions',
    async (test, { remoteProvider, login }) => {
      const expectedResult = {
        public: ['PublicAction'],
        private: {},
      };

      await login(users.S1.ReadOnlyUser);
      await test.resolves(remoteProvider.listActions(), expectedResult);
    }
  );
};
