'use strict';

const CATEGORY_TYPES = {
  Registry: 'Global',
  Dictionary: 'Global',
  System: 'Global',
  History: 'Global',
  Local: 'Local',
  Log: 'Local',
  View: 'Ignore',
  Memory: 'Ignore',
};

const extractDecorator = schema => schema.constructor.name;

const getCategoryType =
    schema => CATEGORY_TYPES[extractDecorator(schema)] || 'Local';

const isGlobalCategory = category => getCategoryType(category) === 'Global';
const isIgnoredCategory = category => getCategoryType(category) === 'Ignore';
const isLocalCategory = category => getCategoryType(category) === 'Local';

const decoratorToRealm = {
  Registry: 'Global',
  Dictionary: 'Global',
  System: 'System',
  Log: 'Local',
  Local: 'Local',
  Table: 'Local',
  History: 'Global',
  View: 'System',
  Object: 'Local',
};

const getCategoryRealm = category =>
  decoratorToRealm[extractDecorator(category)];

const getCategoryFamily = category => {
  const decorator = extractDecorator(category);
  if (decorator === 'Object') {
    return 'Local';
  }
  return decorator;
};

const getCategoryActions = category => Object.keys(category).filter(key => {
  const value = category[key];
  return value.constructor.name === 'Function' &&
    Object.getPrototypeOf(value).name === 'Action';
}).map(key => ({
  Name: key,
  Execute: category[key],
}));

module.exports = {
  getCategoryType,
  isGlobalCategory,
  isIgnoredCategory,
  isLocalCategory,
  extractDecorator,
  getCategoryRealm,
  getCategoryFamily,
  getCategoryActions,
};
