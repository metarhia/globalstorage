'use strict';

module.exports = () => ({
  name: 'generateDDL with default values',
  schemas: [
    {
      type: 'category',
      name: 'Schema',
      module: 'Test',
      definition: {
        default1: { domain: 'Nomen', default: 'default value1' },
        default2: { domain: 'Nomen', default: 'default value2' },
        field: { domain: 'Nomen' },
      },
    },
  ],
  expectedSql: `
-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"       bigserial,
  "default1" text DEFAULT 'default value1',
  "default2" text DEFAULT 'default value2',
  "field"    text
);

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
