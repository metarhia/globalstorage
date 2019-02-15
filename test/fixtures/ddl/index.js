'use strict';

module.exports = ({ Index: index }) => ({
  name: 'generateDDL with index fields',
  schemas: [
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        field1: { domain: 'Nomen' },
        field2: { domain: 'Nomen' },
        field3: { domain: 'Nomen' },
        index1: { domain: 'Nomen', index: true },
        index2: index('field1'),
        index3: index('field2', 'field3'),
      },
    },
  ],
  expectedSql: `
-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"     bigserial,
  "field1" text,
  "field2" text,
  "field3" text,
  "index1" text
);

CREATE INDEX "idxSchemaindex1" on "Schema" ("index1");
CREATE INDEX "idxSchemaindex2" on "Schema" ("field1");
CREATE INDEX "idxSchemaindex3" on "Schema" ("field2", "field3");

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
