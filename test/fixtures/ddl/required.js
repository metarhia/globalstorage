'use strict';

module.exports = () => ({
  name: 'generateDDL with required fields',
  schemas: [
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        required1: { domain: 'Nomen', required: true },
        required2: { domain: 'Nomen', required: true },
        field: { domain: 'Nomen' },
      },
    },
  ],
  expectedSql: `
-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"        bigserial,
  "required1" text NOT NULL,
  "required2" text NOT NULL,
  "field"     text
);

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
