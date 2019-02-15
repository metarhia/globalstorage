'use strict';

module.exports = ({ Registry: registry }) => ({
  name: 'generateDDL with Global',
  schemas: [
    {
      type: 'category',
      name: 'GlobalEntity1',
      module: 'test',
      definition: registry({
        field: { domain: 'Nomen' },
      }),
    },
    {
      type: 'category',
      name: 'GlobalEntity2',
      module: 'test',
      definition: registry({
        field: { domain: 'Nomen' },
        globalEntity: { category: 'GlobalEntity1' },
      }),
    },
  ],
  expectedSql: `
-- Category: GlobalEntity1 -----------------------------------------------------

CREATE TABLE "GlobalEntity1" (
  "Id"    bigint,
  "field" text
);

ALTER TABLE "GlobalEntity1" ADD CONSTRAINT "pkGlobalEntity1Id" \
PRIMARY KEY ("Id");

-- Category: GlobalEntity2 -----------------------------------------------------

CREATE TABLE "GlobalEntity2" (
  "Id"           bigint,
  "field"        text,
  "globalEntity" bigint
);

ALTER TABLE "GlobalEntity2" ADD CONSTRAINT "pkGlobalEntity2Id" \
PRIMARY KEY ("Id");`,
});
