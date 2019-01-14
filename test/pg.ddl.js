'use strict';

const path = require('path');
const metatests = require('metatests');
const metaschema = require('metaschema');
const { generateDDL } = require('../lib/pg.ddl');

const defaultDomainsSql = `CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Enum: "Month" ---------------------------------------------------------------

CREATE TYPE "Month" AS ENUM (
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
);

-- Enum: "Day" -----------------------------------------------------------------

CREATE TYPE "Day" AS ENUM (
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
);
`;

[
  'default',
  'required',
  'defaultDomains',
  'enum',
  'flags',
  'master',
  'include',
  'many',
  'index',
  'unique',
  'domainTypes',
  'foreignKeyBeforeCategory',
  'twoForeignKeysBeforeCategory',
  'history',
  'localToGlobal',
  'globalCategories',
]
  .map(cfgName => require(path.join(__dirname, '/fixtures/ddl/', cfgName)))
  .map(config => config(metaschema.decorators))
  .forEach(config =>
    metatests.test(config.name, test =>
      metaschema.fs.load(null, null, (err, schemas) => {
        test.error(err);

        for (const schemaName in config.schemas) {
          const schema = config.schemas[schemaName];
          if (schemaName === 'domains') {
            Object.assign(schemas[0][1], schema);
          } else {
            schemas.push([schemaName, schema]);
          }
        }

        const [msErr, ms] = metaschema.create(schemas);
        test.error(msErr);

        const actualDDL = generateDDL(ms);
        const expectedDDL = defaultDomainsSql + config.expectedSql;

        test.equal(actualDDL, expectedDDL, 'must return correct sql string');
        test.end();
      })
    )
  );
