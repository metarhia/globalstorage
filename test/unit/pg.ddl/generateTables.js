'use strict';

const { join } = require('path');
const common = require('@metarhia/common');
const metatests = require('metatests');
const metaschema = require('metaschema');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');
const test = metatests.test('pg.ddl.generateTables unit test');

metaschema.fs.loadAndCreate(schemasDir, { common }, (err, ms) => {
  if (err) test.bailout(err);

  test.strictSame(
    ddl.generateTables(
      new Map([
        ['LocalCategory2', ms.categories.get('LocalCategory2')],
        ['LocalCategory1', ms.categories.get('LocalCategory1')],
        ['MemoryTable', ms.categories.get('MemoryTable')],
      ]),
      new Map([['Nomen', 'text']])
    ),
    '\n' +
      '-- Category: LocalCategory2 ------------------------------------------' +
      '----------\n' +
      '\n' +
      'CREATE TABLE "LocalCategory2" (\n' +
      '  "Id"    bigserial,\n' +
      '  "field" bigint\n' +
      ');\n' +
      '\n' +
      'ALTER TABLE "LocalCategory2" ADD CONSTRAINT "pkLocalCategory2Id" ' +
      'PRIMARY KEY ("Id");\n' +
      '\n' +
      '-- Category: LocalCategory1 ------------------------------------------' +
      '----------\n' +
      '\n' +
      'CREATE TABLE "LocalCategory1" (\n' +
      '  "Id"    bigserial,\n' +
      '  "field" text\n' +
      ');\n' +
      '\n' +
      'ALTER TABLE "LocalCategory1" ADD CONSTRAINT "pkLocalCategory1Id" ' +
      'PRIMARY KEY ("Id");\n' +
      '\n' +
      'ALTER TABLE "LocalCategory2" ADD CONSTRAINT "fkLocalCategory2field" ' +
      'FOREIGN KEY ("field") REFERENCES "LocalCategory1" ("Id") ' +
      'ON UPDATE RESTRICT ON DELETE RESTRICT;'
  );

  test.end();
});
