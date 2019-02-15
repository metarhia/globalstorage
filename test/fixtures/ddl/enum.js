'use strict';

module.exports = ({ Enum: createEnum }) => ({
  name: 'generateDDL with Enum',
  schemas: [
    {
      type: 'domains',
      name: 'custom',
      module: 'test',
      definition: {
        EnumDomain: createEnum('value1', 'value2', 'value3'),
      },
    },
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        enumField: { domain: 'EnumDomain' },
      },
    },
  ],
  expectedSql: `
-- Enum: "EnumDomain" ----------------------------------------------------------

CREATE TYPE "EnumDomain" AS ENUM (
  'value1',
  'value2',
  'value3'
);

-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"        bigserial,
  "enumField" "EnumDomain"
);

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
