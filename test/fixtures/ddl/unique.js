'use strict';

module.exports = ({ Unique: unique }) => ({
  name: 'generateDDL with unique fields',
  schemas: [
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        field1: { domain: 'Nomen' },
        field2: { domain: 'Nomen' },
        field3: { domain: 'Nomen' },
        unique1: { domain: 'Nomen', unique: true },
        unique2: unique('field1'),
        unique3: unique('field2', 'field3'),
      },
    },
  ],
  expectedSql: `
-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"      bigserial,
  "field1"  text,
  "field2"  text,
  "field3"  text,
  "unique1" text
);

ALTER TABLE "Schema" ADD CONSTRAINT "akSchemaunique1" UNIQUE ("unique1");
ALTER TABLE "Schema" ADD CONSTRAINT "akSchemaunique2" UNIQUE ("field1");
ALTER TABLE "Schema" ADD CONSTRAINT "akSchemaunique3" UNIQUE \
("field2", "field3");

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
