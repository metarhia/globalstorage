'use strict';

module.exports = ({ Flags: createFlags }) => ({
  name: 'generateDDL with Flags',
  schemas: [
    {
      type: 'domains',
      name: 'custom',
      module: 'test',
      definition: {
        Flags16: createFlags(...Array.from({ length: 16 }, (v, i) => i)),
        Flags32: createFlags(...Array.from({ length: 32 }, (v, i) => i)),
        Flags64: createFlags(...Array.from({ length: 64 }, (v, i) => i)),
      },
    },
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        flags16: { domain: 'Flags16' },
        flags32: { domain: 'Flags32' },
        flags64: { domain: 'Flags64' },
      },
    },
  ],
  expectedSql: `
-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"      bigserial,
  "flags16" smallint,
  "flags32" integer,
  "flags64" bigint
);

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");`,
});
