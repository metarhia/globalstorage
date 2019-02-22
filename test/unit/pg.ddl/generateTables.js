'use strict';

const { join } = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { options, config } = require('../../../lib/metaschema-config/config');
const ddl = require('../../../lib/pg.ddl');

const schemasDir = join(__dirname, '../..', 'fixtures/ddl-unit');

metatests.test('pg.ddl.generateTables unit test', async test => {
  let schema;

  try {
    schema = await metaschema.fs.load(schemasDir, options, config);
  } catch (err) {
    test.fail(err);
    test.end();
    return;
  }

  test.strictSame(
    ddl.generateTables(
      new Map([
        ['LocalCategory2', schema.categories.get('LocalCategory2')],
        ['LocalCategory1', schema.categories.get('LocalCategory1')],
        ['MemoryTable', schema.categories.get('MemoryTable')],
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
