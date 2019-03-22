'use strict';

const jstp = require('@metarhia/jstp');

const { codes: errorCodes } = require('../../lib/errors');

const EXPECTED_ERROR_CODE = errorCodes.INSUFFICIENT_PERMISSIONS;
const EXPECTED_ERROR = new jstp.RemoteError(EXPECTED_ERROR_CODE);

module.exports = (test, { users }) => {
  test.test(
    'check filter applications, not logged in',
    async (test, { remoteProvider }) => {
      const error = await test.rejects(
        remoteProvider.listApplications(),
        EXPECTED_ERROR
      );
      test.strictSame(error.code, EXPECTED_ERROR_CODE);
    }
  );

  test.test(
    'check filter applications for role linked with Person application',
    async (test, { remoteProvider, login }) => {
      const expectedResult = ['PersonApplication'];
      await login(users.S1.AdminUser);
      await test.resolves(remoteProvider.listApplications(), expectedResult);
    }
  );

  test.test(
    'check filter applications for role linked with Document application',
    async (test, { remoteProvider, login }) => {
      const expectedResult = ['DocumentApplication'];
      await login(users.S2.AdminUser);
      await test.resolves(remoteProvider.listApplications(), expectedResult);
    }
  );

  test.test(
    'check filter applications for role not linked with applications',
    async (test, { remoteProvider, login }) => {
      await login(users.S1.GuestUser);
      await test.resolves(remoteProvider.listApplications(), []);
    }
  );
};
