'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');

const { options, config } = require('../lib/metaschema-config/config');
const { StorageProvider } = require('../lib/provider');
const { GSError, codes: errorCodes } = require('../lib/errors');

metatests.test('Fully supports schemas/system', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(
      'test/fixtures/resources',
      options,
      config
    );
  } catch (error) {
    console.error(error);
    test.fail(error);
    test.end();
    return;
  }

  test.strictSame(schema.resources.common.get('en'), '{"Id":"Identifier"}');
  test.strictSame(schema.resources.domains.get('en'), '{"Id":"Identifier"}');
  test.strictSame(
    schema.actions.get('PublicAction').resources.get('en'),
    '{"Login":"Login"}'
  );
  test.strictSame(
    schema.categories.get('Category').resources.get('en'),
    '{"Login":"Login","Password":"Password"}'
  );
  test.strictSame(
    schema.categories
      .get('Category')
      .forms.get('Form')
      .resources.get('en'),
    '{"Login":"Login","Password":"Password"}'
  );
  test.strictSame(
    schema.categories
      .get('Category')
      .actions.get('Action')
      .resources.get('en'),
    '{"Login":"Login"}'
  );
  test.end();
});

metatests.test(
  'StorageProvider supports localization methods',
  async test => {
    let schema;

    try {
      schema = await metaschema.fs.load(
        'test/fixtures/resources',
        options,
        config
      );
    } catch (error) {
      console.error(error);
      test.fail(error);
      test.end();
      return;
    }

    const provider = new StorageProvider({});
    await provider.open({ schema });

    test.endAfterSubtests();

    const runAsyncCompareTest = (fn, expected) => {
      test.test(async t => {
        t.strictSame(await fn(), expected);
        t.end();
      });
    };

    const runAsyncIsErrorTest = (fn, errMessage) => {
      test.test(async t => {
        try {
          await fn();
          test.fail('must have thrown an error');
        } catch (err) {
          t.isError(err, new GSError(errorCodes.NOT_FOUND, errMessage));
        } finally {
          t.end();
        }
      });
    };

    runAsyncCompareTest(
      () => provider.getCommonL10n('en'),
      '{"Id":"Identifier"}'
    );
    runAsyncCompareTest(
      () => provider.getDomainsL10n('en'),
      '{"Id":"Identifier"}'
    );
    runAsyncCompareTest(
      () => provider.getActionL10n('en', null, 'PublicAction'),
      '{"Login":"Login"}'
    );
    runAsyncCompareTest(
      () => provider.getActionL10n('en', 'Category', 'Action'),
      '{"Login":"Login"}'
    );
    runAsyncCompareTest(
      () => provider.getCategoryL10n('en', 'Category'),
      '{"Login":"Login","Password":"Password"}'
    );
    runAsyncCompareTest(
      () => provider.getFormL10n('en', 'Category', 'Form'),
      '{"Login":"Login","Password":"Password"}'
    );
    runAsyncIsErrorTest(
      () => provider.getCommonL10n('uk'),
      `No uk localization data for common`
    );
    runAsyncIsErrorTest(
      () => provider.getDomainsL10n('uk'),
      `No uk localization data for domains`
    );

    runAsyncIsErrorTest(
      () => provider.getActionL10n('uk', null, 'PublicAction'),
      `No uk localization data for public action PublicAction`
    );
    runAsyncIsErrorTest(
      () => provider.getActionL10n('uk', null, 'NON_EXISTENT_ACTION'),
      `No public action NON_EXISTENT_ACTION found`
    );
    runAsyncIsErrorTest(
      () => provider.getActionL10n('en', 'NON_EXISTENT_CATEGORY', 'Action'),
      `No category NON_EXISTENT_CATEGORY found`
    );
    runAsyncIsErrorTest(
      () => provider.getActionL10n('uk', 'Category', 'AnotherAction'),
      `No uk localization data for Category.AnotherAction action`
    );

    runAsyncIsErrorTest(
      () => provider.getCategoryL10n('uk', 'Category'),
      `No uk localization data for Category category`
    );
    runAsyncIsErrorTest(
      () => provider.getCategoryL10n('en', 'NON_EXISTENT_CATEGORY'),
      `No category NON_EXISTENT_CATEGORY found`
    );

    runAsyncIsErrorTest(
      () => provider.getFormL10n('en', 'NON_EXISTENT_CATEGORY', 'Form'),
      `No category NON_EXISTENT_CATEGORY found`
    );
    runAsyncIsErrorTest(
      () => provider.getFormL10n('en', 'Category', 'NON_EXISTENT_FORM'),
      `No form Category.NON_EXISTENT_FORM found`
    );
    runAsyncIsErrorTest(
      () => provider.getFormL10n('uk', 'Category', 'Form'),
      `No uk localization data for Category.Form form`
    );
  },
  { parallelSubtests: true }
);
