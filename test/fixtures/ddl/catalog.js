'use strict';

module.exports = ({ Catalog: catalog }) => ({
  name: 'generateDDL with Catalog',
  schemas: [
    {
      type: 'category',
      name: 'Catalog',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
      },
    },
    {
      type: 'category',
      name: 'Schema',
      module: 'test',
      definition: {
        catalog: catalog(),
      },
    },
  ],
  expectedSql: `
-- Category: Catalog -----------------------------------------------------------

CREATE TABLE "Catalog" (
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Catalog" ADD CONSTRAINT "pkCatalogId" PRIMARY KEY ("Id");

-- Category: Schema ------------------------------------------------------------

CREATE TABLE "Schema" (
  "Id"      bigserial,
  "catalog" bigint NOT NULL
);

CREATE INDEX "idxSchemacatalog" on "Schema" ("catalog");

ALTER TABLE "Schema" ADD CONSTRAINT "pkSchemaId" PRIMARY KEY ("Id");

ALTER TABLE "Schema" ADD CONSTRAINT "fkSchemacatalog" FOREIGN KEY ("catalog") \
REFERENCES "Catalog" ("Id") ON UPDATE RESTRICT ON DELETE RESTRICT;`,
});
