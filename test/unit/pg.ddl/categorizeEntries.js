'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.categorizeEntries unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  const {
    Index: createIndex,
    Unique: createUnique,
    Include: createInclude,
  } = options.localDecorators.category;

  const func = () => {};
  func.domain = 'SomeDomain';

  test.strictSame(ddl.categorizeEntries({ field: func }, 'Schema', null), {
    indexes: [],
    unique: [],
    links: [],
    properties: [],
  });

  test.strictSame(
    ddl.categorizeEntries({ field: createInclude('Schema2') }, 'Schema1', null),
    { indexes: [], unique: [], links: [], properties: [] }
  );

  test.strictSame(
    ddl.categorizeEntries(
      {
        field1: { domain: 'Nomen' },
        field2: { domain: 'Nomen' },
        indexOnField: { domain: 'Nomen', index: true },
        indexDecorator: createIndex('field1'),
        compositeIndex: createIndex('field1', 'field2'),
        uniqueOnField: { domain: 'Nomen', unique: true },
        uniqueDecorator: createUnique('field2'),
        compositeUnique: createUnique('field1', 'field2'),
        prop: { domain: 'Nomen' },
      },
      'Schema1',
      null
    ),
    {
      indexes: [
        { name: 'indexOnField', property: { domain: 'Nomen', index: true } },
        { name: 'indexDecorator', property: { fields: ['field1'] } },
        {
          name: 'compositeIndex',
          property: { fields: ['field1', 'field2'] },
        },
      ],
      unique: [
        {
          name: 'uniqueOnField',
          property: { domain: 'Nomen', unique: true },
        },
        { name: 'uniqueDecorator', property: { fields: ['field2'] } },
        {
          name: 'compositeUnique',
          property: { fields: ['field1', 'field2'] },
        },
      ],
      links: [],
      properties: [
        { name: 'field1', property: { domain: 'Nomen' } },
        { name: 'field2', property: { domain: 'Nomen' } },
        { name: 'indexOnField', property: { domain: 'Nomen', index: true } },
        {
          name: 'uniqueOnField',
          property: { domain: 'Nomen', unique: true },
        },
        { name: 'prop', property: { domain: 'Nomen' } },
      ],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      schema.categories.get('LocalCategory2').definition,
      'LocalCategory2',
      schema.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: schema.categories.get('LocalCategory2').definition.field,
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
      properties: [
        {
          name: 'field',
          property: schema.categories.get('LocalCategory2').definition.field,
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      schema.categories.get('GlobalCategory2').definition,
      'GlobalCategory2',
      schema.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: schema.categories.get('GlobalCategory2').definition.field,
          foreignKey: true,
          destination: 'Identifier',
        },
      ],
      properties: [
        {
          name: 'field',
          property: schema.categories.get('GlobalCategory2').definition.field,
          foreignKey: true,
          destination: 'Identifier',
        },
      ],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      schema.categories.get('CategoryWithMany').definition,
      'CategoryWithMany',
      schema.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: schema.categories.get('CategoryWithMany').definition.field,
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
      properties: [],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      schema.categories.get('CategoryWithMaster').definition,
      'CategoryWithMaster',
      schema.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: {
            category: 'GlobalCategory1',
            definition: {
              field: {
                domain: 'Nomen',
                definition: { type: 'string', length: 60 },
              },
            },
            required: true,
          },
          foreignKey: true,
          destination: 'Identifier',
        },
      ],
      properties: [
        {
          name: 'field',
          property: {
            category: 'GlobalCategory1',
            definition: {
              field: {
                domain: 'Nomen',
                definition: { type: 'string', length: 60 },
              },
            },
            required: true,
          },
          foreignKey: true,
          destination: 'Identifier',
        },
      ],
    }
  );

  const CustomRelationDecorator = function(name) {
    this.category = name;
    this.definition = schema.categories.get(name).definition;
  };

  const instance = {
    field: new CustomRelationDecorator('LocalCategory1'),
  };

  test.strictSame(ddl.categorizeEntries(instance, 'Table', schema.categories), {
    indexes: [],
    unique: [],
    links: [
      {
        name: 'field',
        property: {
          category: 'LocalCategory1',
          definition: {
            field: {
              domain: 'Nomen',
              definition: { type: 'string', length: 60 },
            },
          },
        },
        foreignKey: true,
        destination: 'LocalCategory1',
      },
    ],
    properties: [
      {
        name: 'field',
        property: {
          category: 'LocalCategory1',
          definition: {
            field: {
              domain: 'Nomen',
              definition: { type: 'string', length: 60 },
            },
          },
        },
        foreignKey: true,
        destination: 'LocalCategory1',
      },
    ],
  });

  test.strictSame(
    ddl.categorizeEntries(
      schema.categories.get('GlobalCategoryWithMany').definition,
      'GlobalCategoryWithMany',
      schema.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: {
            category: 'GlobalCategory1',
            definition: {
              field: {
                domain: 'Nomen',
                definition: { type: 'string', length: 60 },
              },
            },
          },
          foreignKey: true,
          destination: 'Identifier',
        },
      ],
      properties: [],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      {
        field: {},
      },
      'Schema',
      schema.categories
    ),
    { indexes: [], unique: [], links: [], properties: [] }
  );

  test.throws(
    () =>
      ddl.categorizeEntries({ ' field': { domain: 'Nomen' } }, 'Schema', null),
    new Error(
      'Cannot create entry Schema. field because it is not a valid identifier'
    )
  );

  test.end();
});
