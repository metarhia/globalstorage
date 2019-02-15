'use strict';

module.exports = ({ Include: include }) => ({
  name: 'generateDDL with Include',
  schemas: [
    {
      type: 'category',
      name: 'Schema1',
      module: 'test',
      definition: {
        field: { domain: 'Nomen' },
        schema2: include('Schema2'),
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
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Schema1" ADD CONSTRAINT "pkSchema1Id" PRIMARY KEY ("Id");

-- Category: Schema2 -----------------------------------------------------------

CREATE TABLE "Schema2" (
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Schema2" ADD CONSTRAINT "pkSchema2Id" PRIMARY KEY ("Id");`,
});
