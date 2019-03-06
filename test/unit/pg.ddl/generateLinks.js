'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.generateLinks unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  test.strictSame(
    ddl.generateLinks(
      [
        {
          from: 'LocalCategory2',
          to: 'LocalCategory1',
          name: 'field',
          link: schema.categories.get('LocalCategory2').definition.field,
          destination: 'LocalCategory1',
        },
        {
          from: 'CategoryWithMany',
          to: 'LocalCategory1',
          name: 'field',
          link: schema.categories.get('CategoryWithMany').definition.field,
          destination: 'LocalCategory1',
        },
        {
          from: 'LocalCategory2',
          to: 'LocalCategory1',
          name: 'field',
          link: schema.categories.get('LocalCategory2').definition.field,
          destination: 'LocalCategory1',
        },
        {
          from: 'GlobalCategory3',
          to: 'GlobalCategory1',
          name: 'field',
          link: schema.categories.get('GlobalCategory3').definition.field,
          destination: 'Identifier',
        },
      ],
      schema.categories
    ),
    'ALTER TABLE "LocalCategory2" ADD CONSTRAINT "fkLocalCategory2field" ' +
      'FOREIGN KEY ("field") REFERENCES "LocalCategory1" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE RESTRICT;\n' +
      'ALTER TABLE "LocalCategory2" ADD CONSTRAINT "fkLocalCategory2field" ' +
      'FOREIGN KEY ("field") REFERENCES "LocalCategory1" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE RESTRICT;\n' +
      '\n' +
      'CREATE TABLE "CategoryWithManyfield" (\n' +
      '  "CategoryWithMany" bigint NOT NULL,\n' +
      '  "field"            bigint NOT NULL\n' +
      ');\n' +
      'ALTER TABLE "CategoryWithManyfield" ADD CONSTRAINT ' +
      '"fkCategoryWithManyfieldCategoryWithMany" FOREIGN KEY ' +
      '("CategoryWithMany") REFERENCES "CategoryWithMany" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE CASCADE;\n' +
      'ALTER TABLE "CategoryWithManyfield" ADD CONSTRAINT ' +
      '"fkCategoryWithManyfieldfield" FOREIGN KEY ("field") ' +
      'REFERENCES "LocalCategory1" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE CASCADE;\n' +
      'ALTER TABLE "CategoryWithManyfield" ADD CONSTRAINT ' +
      '"pkfieldCategoryWithManyLocalCategory1" PRIMARY KEY ' +
      '("CategoryWithMany", "field");\n' +
      '\n' +
      'CREATE TABLE "GlobalCategory3field" (\n' +
      '  "GlobalCategory3" bigint NOT NULL,\n' +
      '  "field"           bigint NOT NULL\n' +
      ');\n' +
      'ALTER TABLE "GlobalCategory3field" ADD CONSTRAINT ' +
      '"fkGlobalCategory3fieldGlobalCategory3" FOREIGN KEY ' +
      '("GlobalCategory3") REFERENCES "GlobalCategory3" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE CASCADE;\n' +
      'ALTER TABLE "GlobalCategory3field" ADD CONSTRAINT ' +
      '"fkGlobalCategory3fieldfield" FOREIGN KEY ("field") ' +
      'REFERENCES "Identifier" ("Id") ON UPDATE RESTRICT ' +
      'ON DELETE CASCADE;\n' +
      'ALTER TABLE "GlobalCategory3field" ADD CONSTRAINT ' +
      '"pkfieldGlobalCategory3GlobalCategory1" PRIMARY KEY ' +
      '("GlobalCategory3", "field");'
  );

  test.end();
});
