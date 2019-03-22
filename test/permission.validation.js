'use strict';

const fs = require('fs');
const path = require('path');
const metatests = require('metatests');
const util = require('util');

const {
  setup,
  prepareRemoteProvider,
} = require('./fixtures/permission-validation/setup');

const runTests = (test, ctx) => {
  const testsDir = path.join(__dirname, 'permissions');
  const readdir = util.promisify(fs.readdir);
  return readdir(testsDir).then(testFiles => {
    const extensionIndex = -3;
    for (const testFile of testFiles) {
      const testName = testFile.slice(0, extensionIndex);
      const testFilePath = path.join(testsDir, testFile);
      const runTest = require(testFilePath);
      const subtest = test.test(testName);

      subtest.beforeEach(prepareRemoteProvider(ctx.schema));
      subtest.afterEach(async test => test.context.remoteProvider.close());
      runTest(subtest, ctx);
    }
  });
};

metatests.test(
  'Permission validation test',
  async test => {
    let ctx;

    try {
      ctx = await setup();
    } catch (err) {
      if (process.env.CI) {
        test.fail('PostgresDB setup failed');
      } else {
        console.error(
          'Cannot setup PostgresDB, skipping permission validation tests'
        );
      }
      console.error(err);
      return;
    }

    test.on('done', async () => {
      await ctx.provider.close();
      ctx.server.close();
    });

    await runTests(test, ctx);
  },
  { parallelSubtests: true }
);
