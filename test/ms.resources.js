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

metatests.test('StorageProvider supports localization methods', async test => {
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
  provider.open({ schema }, () => {
    test.plan(24);
    provider.getCommonL10n('en', (err, l10n) => {
      test.error(err);
      test.strictSame(l10n, '{"Id":"Identifier"}');
    });
    provider.getDomainsL10n('en', (err, l10n) => {
      test.error(err);
      test.strictSame(l10n, '{"Id":"Identifier"}');
    });
    provider.getActionL10n('en', null, 'PublicAction', (err, l10n) => {
      test.error(err);
      test.strictSame(l10n, '{"Login":"Login"}');
    });
    provider.getActionL10n('en', 'Category', 'Action', (err, l10n) => {
      test.error(err);
      test.strictSame(l10n, '{"Login":"Login"}');
    });
    provider.getCategoryL10n('en', 'Category', (err, l10n) => {
      test.error(err);
      test.strictSame(l10n, '{"Login":"Login","Password":"Password"}');
    });
    provider.getFormL10n('en', 'Category', 'Form', (err, l10n) => {
      test.error(err);
      test.strictSame(l10n, '{"Login":"Login","Password":"Password"}');
    });
    provider.getCommonL10n('uk', err => {
      test.isError(
        err,
        new GSError(errorCodes.NOT_FOUND, `No uk localization data for common`)
      );
    });
    provider.getDomainsL10n('uk', err => {
      test.isError(
        err,
        new GSError(errorCodes.NOT_FOUND, `No uk localization data for domains`)
      );
    });

    provider.getActionL10n('uk', null, 'PublicAction', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No uk localization data for public action PublicAction`
        )
      );
    });
    provider.getActionL10n('uk', null, 'NON_EXISTENT_ACTION', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No public action NON_EXISTENT_ACTION found`
        )
      );
    });
    provider.getActionL10n('en', 'NON_EXISTENT_CATEGORY', 'Action', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No category NON_EXISTENT_CATEGORY found`
        )
      );
    });
    provider.getActionL10n('en', 'NON_EXISTENT_CATEGORY', 'Action', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No category NON_EXISTENT_CATEGORY found`
        )
      );
    });
    provider.getActionL10n('uk', 'Category', 'AnotherAction', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No uk localization data for Category.AnotherAction action`
        )
      );
    });

    provider.getCategoryL10n('uk', 'Category', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No uk localization data for Category category`
        )
      );
    });
    provider.getCategoryL10n('en', 'NON_EXISTENT_CATEGORY', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No category NON_EXISTENT_CATEGORY found`
        )
      );
    });

    provider.getFormL10n('en', 'NON_EXISTENT_CATEGORY', 'Form', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No category NON_EXISTENT_CATEGORY found`
        )
      );
    });
    provider.getFormL10n('en', 'Category', 'NON_EXISTENT_FORM', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No form Category.NON_EXISTENT_FORM found`
        )
      );
    });
    provider.getFormL10n('uk', 'Category', 'Form', err => {
      test.isError(
        err,
        new GSError(
          errorCodes.NOT_FOUND,
          `No uk localization data for Category.Form form`
        )
      );
    });
  });
});
