'use strict';

const { runInNewContext } = require('vm');

const metatests = require('metatests');
const metaschema = require('metaschema');

const { serializeSchema } = require('../lib/metaschema-config/serialization');
const { options, config } = require('../lib/metaschema-config/config');

const decorators = require('../lib/metaschema-config/decorators');

const omitKeys = (obj, keys) => {
  const res = {};
  for (const key in obj) {
    if (!keys.includes(key)) res[key] = obj[key];
  }
  return res;
};

metatests.test('Serialization', async test => {
  const schema = await metaschema.fs.load(
    'test/fixtures/serialization',
    options,
    config
  );

  const domains = schema.schemas[0];
  const stringifyDomains = serializeSchema(domains);

  const category = schema.categories.get('Test');
  const { type, module, name, source } = serializeSchema(category, {
    exclude: (name, ins) =>
      ['Unique'].includes(metaschema.extractDecorator(ins)),
  });
  const stringifyCategory = { type, name, module, source };

  const action = schema.actions.get('Test');
  const stringifyAction = serializeSchema(action);

  const application = schema.applications.get('Test');
  const stringifyApplication = serializeSchema(application);

  stringifyDomains.definition = metaschema.processSchema(
    'TestDomains',
    stringifyDomains.source,
    {
      decorators: decorators.localDecorators.domains,
    },
    runInNewContext
  );

  stringifyCategory.definition = metaschema.processSchema(
    'TestCategory',
    stringifyCategory.source,
    {
      decorators: decorators.localDecorators.category,
    },
    runInNewContext
  );

  stringifyAction.definition = metaschema.processSchema(
    'TestAction',
    stringifyAction.source,
    {
      decorators: {
        ...decorators.localDecorators.action,
        ...decorators.decorators,
      },
    },
    runInNewContext
  );

  const catalog = schema.categories.get('Catalog');
  const subsystem = schema.categories.get('Subsystem');

  stringifyApplication.definition = metaschema.processSchema(
    'TestApplication',
    stringifyApplication.source,
    {
      decorators: {
        ...decorators.localDecorators.application,
        ...decorators.decorators,
      },
      categories: [category, catalog, subsystem],
    },
    runInNewContext
  );

  const newSchema = metaschema.Metaschema.create(
    [
      stringifyDomains,
      stringifyCategory,
      stringifyAction,
      stringifyApplication,
      catalog,
      subsystem,
    ],
    config
  );

  const newDomains = newSchema.schemas.find(
    schema => schema.type === 'domains'
  );
  const newCategory = newSchema.categories.get('Test');
  const newAction = newSchema.actions.get('Test');
  const newApplication = newSchema.applications.get('Test');

  const {
    HierarchyField: { definition: hierarchyDefinition, ...hierarchy },
    ...categoryDefinition
  } = omitKeys(category.definition, ['UniqueField']);

  const {
    HierarchyField: { definition: newHierarchyDefinition, ...newHierarchy },
    ...newCategoryDefinition
  } = newCategory.definition;

  const actionDefinition = omitKeys(action.definition, ['Execute']);
  const { Execute: newExecute, ...newActionDefinition } = newAction.definition;

  test.strictSame(newDomains.definition, domains.definition);
  test.strictSame(newCategoryDefinition, categoryDefinition);

  test.strictSame(newApplication.definition, application.definition);

  test.assert(category.definition === hierarchyDefinition);
  test.assert(newCategory.definition === newHierarchyDefinition);
  test.strictSame(hierarchy, newHierarchy);

  test.strictSame(actionDefinition, newActionDefinition);
  test.strictSame(newExecute.toString(), 'async()=>{}');

  test.end();
});
