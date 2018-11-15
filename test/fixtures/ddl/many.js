'use strict';

module.exports = ({ Many: many }) => ({
  name: 'generateDDL with Many',
  schemas: {
    Schema1: {
      field: { domain: 'Nomen' },
    },
    Schema2: {
      field: { domain: 'Nomen' },
      link: many('Schema1'),
    },
  },
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

ALTER TABLE "Schema2" ADD CONSTRAINT "pkSchema2Id" PRIMARY KEY ("Id");


CREATE TABLE "Schema2link" (
  "Schema2" bigint NOT NULL,
  "Schema1" bigint NOT NULL
);
ALTER TABLE "Schema2link" ADD CONSTRAINT "fkSchema2linkSchema2" \
FOREIGN KEY ("Schema2") REFERENCES "Schema2" ("Id") \
ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE "Schema2link" ADD CONSTRAINT "fkSchema2linkSchema1" \
FOREIGN KEY ("Schema1") REFERENCES "Schema1" ("Id") \
ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE "Schema2link" ADD CONSTRAINT "pklinkSchema2Schema1" \
PRIMARY KEY ("Schema2", "Schema1");`,
});
