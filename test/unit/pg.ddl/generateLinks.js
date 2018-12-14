'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.generateLinks unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  test.strictSame(
    ddl.generateLinks(
      [
        {
          from: 'LocalCategory2',
          to: 'LocalCategory1',
          name: 'field',
          link: ms.categories.get('LocalCategory2').definition.field,
          destination: 'LocalCategory1',
        },
        {
          from: 'CategoryWithMany',
          to: 'LocalCategory1',
          name: 'field',
          link: ms.categories.get('CategoryWithMany').definition.field,
          destination: 'LocalCategory1',
        },
        {
          from: 'LocalCategory2',
          to: 'LocalCategory1',
          name: 'field',
          link: ms.categories.get('LocalCategory2').definition.field,
          destination: 'LocalCategory1',
        },
        {
          from: 'GlobalCategory3',
          to: 'GlobalCategory1',
          name: 'field',
          link: ms.categories.get('GlobalCategory3').definition.field,
          destination: 'Identifier',
        },
      ],
      ms.categories
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
      '"pkfieldGlobalCategory3GlobalCategory1" PRIMARY KEY ' +
      '("GlobalCategory3", "field");'
  );

  test.end();
});
