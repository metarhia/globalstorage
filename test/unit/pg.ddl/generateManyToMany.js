'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.generateManyToMany unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  test.strictSame(
    ddl.generateManyToMany(
      'CategoryWithMany',
      'LocalCategory1',
      'field',
      schema.categories,
      'LocalCategory1'
    ),
    '\n' +
      'CREATE TABLE "CategoryWithManyfield" (\n' +
      '  "CategoryWithMany" bigint NOT NULL,\n' +
      '  "field"            bigint NOT NULL\n' +
      ');\n' +
      'ALTER TABLE "CategoryWithManyfield" ' +
      'ADD CONSTRAINT "fkCategoryWithManyfieldCategoryWithMany" ' +
      'FOREIGN KEY ("CategoryWithMany") REFERENCES "CategoryWithMany" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE CASCADE;\n' +
      'ALTER TABLE "CategoryWithManyfield" ' +
      'ADD CONSTRAINT "fkCategoryWithManyfieldfield" ' +
      'FOREIGN KEY ("field") REFERENCES "LocalCategory1" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE CASCADE;\n' +
      'ALTER TABLE "CategoryWithManyfield" ' +
      'ADD CONSTRAINT "pkfieldCategoryWithManyLocalCategory1" ' +
      'PRIMARY KEY ("CategoryWithMany", "field");'
  );

  test.strictSame(
    ddl.generateManyToMany(
      'GlobalCategory3',
      'GlobalCategory1',
      'field',
      schema.categories,
      'GlobalCategory1'
    ),
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
      'REFERENCES "GlobalCategory1" ("Id") ON UPDATE RESTRICT ' +
      'ON DELETE CASCADE;\n' +
      'ALTER TABLE "GlobalCategory3field" ADD CONSTRAINT ' +
      '"pkfieldGlobalCategory3GlobalCategory1" ' +
      'PRIMARY KEY ("GlobalCategory3", "field");'
  );

  test.throws(
    () =>
      ddl.generateManyToMany(
        'LocalCategory3',
        'Schema!',
        'field',
        schema.categories,
        'Schema!'
      ),
    new Error(
      'Cannot create constraint pkfieldLocalCategory3Schema! ' +
        'because it is not a valid identifier'
    )
  );

  test.end();
});
