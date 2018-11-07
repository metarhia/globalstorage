'use strict';

const CATEGORY_TYPES = {
  Registry: 'Global',
  Dictionary: 'Global',
  System: 'Global',
  History: 'Global',
  Local: 'Local',
  Log: 'Ignore',
  View: 'Ignore',
  Memory: 'Ignore',
};

const extractDecorator = schema => schema.constructor.name;

const getCategoryType =
    schema => CATEGORY_TYPES[extractDecorator(schema)] || 'Local';

const isGlobalCategory = category => getCategoryType(category) === 'Global';
const isIgnoredCategory = category => getCategoryType(category) === 'Ignore';
const isLocalCategory = category => getCategoryType(category) === 'Local';

module.exports = {
  getCategoryType,
  isGlobalCategory,
  isIgnoredCategory,
  isLocalCategory,
  extractDecorator,
};
