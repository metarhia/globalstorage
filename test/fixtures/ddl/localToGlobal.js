'use strict';

module.exports = ({ Registry: registry }) => ({
  name: 'link to global category from local',
  schemas: {
    GlobalEntity: registry({
      field: { domain: 'Nomen' },
    }),
    LocalEntity: {
      field: { domain: 'Nomen' },
      globalEntity: { category: 'GlobalEntity' },
    },
    Identifier: {
      field: { domain: 'Nomen' },
    },
  },
  expectedSql: `
-- Category: GlobalEntity ------------------------------------------------------

CREATE TABLE "GlobalEntity" (
  "Id"    bigint,
  "field" text
);

ALTER TABLE "GlobalEntity" ADD CONSTRAINT "pkGlobalEntityId" PRIMARY KEY ("Id");

-- Category: LocalEntity -------------------------------------------------------

CREATE TABLE "LocalEntity" (
  "Id"           bigserial,
  "field"        text,
  "globalEntity" bigint
);

ALTER TABLE "LocalEntity" ADD CONSTRAINT "pkLocalEntityId" PRIMARY KEY ("Id");

-- Category: Identifier --------------------------------------------------------

CREATE TABLE "Identifier" (
  "Id"    bigserial,
  "field" text
);

ALTER TABLE "Identifier" ADD CONSTRAINT "pkIdentifierId" PRIMARY KEY ("Id");

ALTER TABLE "LocalEntity" ADD CONSTRAINT "fkLocalEntityglobalEntity" \
FOREIGN KEY ("globalEntity") REFERENCES "Identifier" ("Id") \
ON UPDATE RESTRICT ON DELETE RESTRICT;`,
});
