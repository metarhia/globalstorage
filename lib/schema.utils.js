'use strict';

const { iter } = require('@metarhia/common');
const { extractDecorator } = require('metaschema');

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

const getCategoryType = schema =>
  CATEGORY_TYPES[extractDecorator(schema)] || 'Local';

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

const constructActions = (actions, pub, category) => {
  const common = {
    Public: pub,
  };
  if (!pub) common.Category = category;

  return iter(actions).map(([key, value]) => ({
    ...common,
    Name: key,
    Execute: value.definition.Execute,
  }));
};

const extractIncludeCategoriesData = (category, record) => {
  const result = [];
  for (const key in category) {
    const field = category[key];
    if (extractDecorator(field) === 'Include') {
      result.push({
        category: field.category,
        value: record[key],
      });
    }
  }
  return result;
};

const extractIncludeCategories = category => {
  const result = [];
  for (const key in category) {
    const field = category[key];
    if (extractDecorator(field) === 'Include') {
      result.push(field.category);
    }
  }
  return result;
};

module.exports = {
  getCategoryType,
  isGlobalCategory,
  isIgnoredCategory,
  isLocalCategory,
  getCategoryRealm,
  getCategoryFamily,
  constructActions,
  extractIncludeCategoriesData,
  extractIncludeCategories,
};
