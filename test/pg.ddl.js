'use strict';

const path = require('path');
const metatests = require('metatests');
const { Metaschema } = require('metaschema');

const { generateDDL } = require('../lib/pg.ddl');
const {
  options,
  config: msConfig,
} = require('../lib/metaschema-config/config');

const decorators = {
  ...options.decorators,
  ...options.localDecorators.action,
  ...options.localDecorators.category,
  ...options.localDecorators.domains,
  ...options.localDecorators.form,
};

const createEnum = decorators.Enum;

const defaultDomains = [
  {
    type: 'domains',
    module: 'test',
    definition: {
      Month: createEnum(
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
      ),
      Day: createEnum(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ),
      Nomen: { type: 'string', length: 60 },
      Logical: { type: 'boolean', control: 'CheckBox' },
      Id: { type: 'bigint' },
      Time: { type: 'object', class: 'Date', format: 'hh:mm:ss' },
      DateDay: { type: 'object', class: 'Date', format: 'yyyy-mm-dd' },
      DateTime: {
        type: 'object',
        class: 'Date',
        format: 'yyyy-mm-dd hh:mm:ss',
      },
      JSON: { type: 'string', control: 'Multiline' },
    },
  },
];

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
  'defaultDomains',
  'default',
  'required',
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
  'catalog',
]
  .map(cfgName => require(path.join(__dirname, '/fixtures/ddl/', cfgName)))
  .map(config => config(decorators))
  .forEach(config =>
    metatests.test(config.name, test => {
      const ms = Metaschema.create(
        [...defaultDomains, ...config.schemas],
        msConfig
      );

      const actualDDL = generateDDL(ms);
      const expectedDDL = defaultDomainsSql + config.expectedSql;

      test.equal(actualDDL, expectedDDL, 'must return correct sql string');
      test.end();
    })
  );
