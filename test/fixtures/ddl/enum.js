'use strict';

module.exports = ({ Enum: createEnum }) => ({
  name: 'generateDDL with Enum',
  schemas: {
    domains: {
      EnumDomain: createEnum('value1', 'value2', 'value3'),
    },
    Schema: {
      enumField: { domain: 'EnumDomain' },
    },
  },
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
