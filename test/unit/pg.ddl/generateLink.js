'use strict';

const metatests = require('metatests');
const ddl = require('../../../lib/pg.ddl');

const test = metatests.test('pg.ddl.generateLink unit test');

test.strictSame(
  ddl.generateLink('Schema1', 'Schema2', 'field', 'Object', 'Schema2'),
  'ALTER TABLE "Schema1" ADD CONSTRAINT "fkSchema1field" ' +
    'FOREIGN KEY ("field") REFERENCES "Schema2" ("Id") ' +
    'ON UPDATE RESTRICT ON DELETE RESTRICT;'
);

test.strictSame(
  ddl.generateLink('Schema1', 'Schema2', 'field', 'Master', 'Schema2'),
  'ALTER TABLE "Schema1" ADD CONSTRAINT "fkSchema1field" ' +
    'FOREIGN KEY ("field") REFERENCES "Schema2" ("Id") ' +
    'ON UPDATE RESTRICT ON DELETE CASCADE;'
);

test.throws(
  () => ddl.generateLink('!!!INVALIID_IDENTIFIER!!!', '', ''),
  new Error(
    'Cannot create constraint fk!!!INVALIID_IDENTIFIER!!! ' +
      'because it is not a valid identifier'
  )
);

test.throws(
  () =>
    ddl.generateLink(
      'Schema1',
      'Schema2',
      'field',
      'UnsupportedDecorator',
      'Schema2'
    ),
  new Error('UnsupportedDecorator decorator is not supported')
);

test.end();
