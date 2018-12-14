'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.categorizeEntries unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  const {
    decorators: {
      Index: createIndex,
      Unique: createUnique,
      Include: createInclude,
    },
  } = metaschema;

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
      ms.categories.get('LocalCategory2').definition,
      'LocalCategory2',
      ms.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: ms.categories.get('LocalCategory2').definition.field,
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
      properties: [
        {
          name: 'field',
          property: ms.categories.get('LocalCategory2').definition.field,
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      ms.categories.get('GlobalCategory2').definition,
      'GlobalCategory2',
      ms.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [],
      properties: [
        {
          name: 'field',
          property: ms.categories.get('GlobalCategory2').definition.field,
          foreignKey: false,
          destination: 'Identifier',
        },
      ],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      ms.categories.get('CategoryWithMany').definition,
      'CategoryWithMany',
      ms.categories
    ),
    {
      indexes: [],
      unique: [],
      links: [
        {
          name: 'field',
          property: ms.categories.get('CategoryWithMany').definition.field,
          foreignKey: true,
          destination: 'LocalCategory1',
        },
      ],
      properties: [],
    }
  );

  test.strictSame(
    ddl.categorizeEntries(
      ms.categories.get('CategoryWithMaster').definition,
      'CategoryWithMaster',
      ms.categories
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
    this.definition = ms.categories.get(name).definition;
  };

  const instance = {
    field: new CustomRelationDecorator('LocalCategory1'),
  };

  test.strictSame(ddl.categorizeEntries(instance, 'Table', ms.categories), {
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
          required: false,
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
          required: false,
        },
        foreignKey: true,
        destination: 'LocalCategory1',
      },
    ],
  });

  test.strictSame(
    ddl.categorizeEntries(
      ms.categories.get('GlobalCategoryWithMany').definition,
      'GlobalCategoryWithMany',
      ms.categories
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
          foreignKey: false,
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
      ms.categories
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
