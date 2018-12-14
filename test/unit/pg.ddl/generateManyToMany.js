'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.generateManyToMany unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  test.strictSame(
    ddl.generateManyToMany(
      'CategoryWithMany',
      'LocalCategory1',
      'field',
      ms.categories,
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
      ms.categories,
      'GlobalCategory1'
    ),
    '\n' +
      'CREATE TABLE "GlobalCategory3field" (\n' +
      '  "GlobalCategory3" bigint NOT NULL,\n' +
      '  "field"           bigint NOT NULL\n' +
      ');\n' +
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
        ms.categories,
        'Schema!'
      ),
    new Error(
      'Cannot create constraint pkfieldLocalCategory3Schema! ' +
        'because it is not a valid identifier'
    )
  );

  test.end();
});
