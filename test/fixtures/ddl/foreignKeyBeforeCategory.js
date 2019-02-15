'use strict';

module.exports = () => ({
  name: 'link definition to a destination before its creation',
  schemas: [
    {
      type: 'category',
      name: 'Schema1',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
        schema2: { category: 'Schema2' },
      },
    },
    {
      type: 'category',
      name: 'Schema2',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
      },
    },
  ],
  expectedSql: `
-- Category: Schema1 -----------------------------------------------------------

CREATE TABLE "Schema1" (
  "Id"      bigserial,
  "field"   text,
  "schema2" bigint
);

ALTER TABLE "Schema1" ADD CONSTRAINT "pkSchema1Id" PRIMARY KEY ("Id");

-- Category: Schema2 -----------------------------------------------------------

CREATE TABLE "Schema2" (
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Schema2" ADD CONSTRAINT "pkSchema2Id" PRIMARY KEY ("Id");

ALTER TABLE "Schema1" ADD CONSTRAINT "fkSchema1schema2" \
FOREIGN KEY ("schema2") REFERENCES "Schema2" ("Id") \
ON UPDATE RESTRICT ON DELETE RESTRICT;`,
});
