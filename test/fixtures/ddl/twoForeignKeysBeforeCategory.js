'use strict';

module.exports = () => ({
  name: 'two links definition to a destination before its creation',
  schemas: [
    {
      type: 'category',
      name: 'Schema1',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
        schema3: { category: 'Schema3' },
      },
    },
    {
      type: 'category',
      name: 'Schema2',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
        schema3: { category: 'Schema3' },
      },
    },
    {
      type: 'category',
      name: 'Schema3',
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
  "schema3" bigint
);

ALTER TABLE "Schema1" ADD CONSTRAINT "pkSchema1Id" PRIMARY KEY ("Id");

-- Category: Schema2 -----------------------------------------------------------

CREATE TABLE "Schema2" (
  "Id"      bigserial,
  "field"   text,
  "schema3" bigint
);

ALTER TABLE "Schema2" ADD CONSTRAINT "pkSchema2Id" PRIMARY KEY ("Id");

-- Category: Schema3 -----------------------------------------------------------

CREATE TABLE "Schema3" (
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Schema3" ADD CONSTRAINT "pkSchema3Id" PRIMARY KEY ("Id");

ALTER TABLE "Schema1" ADD CONSTRAINT "fkSchema1schema3" \
FOREIGN KEY ("schema3") REFERENCES "Schema3" ("Id") \
ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE "Schema2" ADD CONSTRAINT "fkSchema2schema3" \
FOREIGN KEY ("schema3") REFERENCES "Schema3" ("Id") \
ON UPDATE RESTRICT ON DELETE RESTRICT;`,
});
