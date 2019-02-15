'use strict';

module.exports = ({ Master: master }) => ({
  name: 'generateDDL with Master',
  schemas: [
    {
      type: 'category',
      name: 'Schema1',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
      },
    },
    {
      type: 'category',
      name: 'Schema2',
      module: 'test',
      definition: {
        master: master('Schema1'),
      },
    },
  ],
  expectedSql: `
-- Category: Schema1 -----------------------------------------------------------

CREATE TABLE "Schema1" (
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Schema1" ADD CONSTRAINT "pkSchema1Id" PRIMARY KEY ("Id");

-- Category: Schema2 -----------------------------------------------------------

CREATE TABLE "Schema2" (
  "Id"     bigserial,
  "master" bigint NOT NULL
);

ALTER TABLE "Schema2" ADD CONSTRAINT "pkSchema2Id" PRIMARY KEY ("Id");

ALTER TABLE "Schema2" ADD CONSTRAINT "fkSchema2master" FOREIGN KEY ("master") \
REFERENCES "Schema1" ("Id") ON UPDATE RESTRICT ON DELETE CASCADE;`,
});
