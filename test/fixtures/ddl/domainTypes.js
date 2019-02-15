'use strict';

module.exports = () => ({
  name: 'generateDDL with all domain types',
  schemas: [
    {
      type: 'domains',
      name: 'custom',
      module: 'test',
      definition: {
        Text: { type: 'string' },
        Int: { type: 'number', subtype: 'int' },
        BigInt: { type: 'bigint' },
        Floating: { type: 'number' },
        Date: { type: 'object', class: 'Date' },
        Bytes: { type: 'object', class: 'Uint8Array' },
        Function: { type: 'function' },
      },
    },
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        logicalField: { domain: 'Logical' },
        textField: { domain: 'Text' },
        intField: { domain: 'Int' },
        bigintField: { domain: 'BigInt' },
        floatingField: { domain: 'Floating' },
        dateField: { domain: 'Date' },
        bytesField: { domain: 'Bytes' },
        fnField: { domain: 'Function' },
        // predefined domains
        timeField: { domain: 'Time' },
        dateDayField: { domain: 'DateDay' },
        dateTimeField: { domain: 'DateTime' },
        idField: { domain: 'Id' },
        jsonField: { domain: 'JSON' },
      },
    },
  ],
  expectedSql: `
-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"            bigserial,
  "logicalField"  boolean,
  "textField"     text,
  "intField"      integer,
  "bigintField"   bigint,
  "floatingField" double precision,
  "dateField"     timestamp with time zone,
  "bytesField"    bytea,
  "fnField"       text,
  "timeField"     time with time zone,
  "dateDayField"  date,
  "dateTimeField" timestamp with time zone,
  "idField"       bigint,
  "jsonField"     jsonb
);

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
