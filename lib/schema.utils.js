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

const getCategoryType = type => CATEGORY_TYPES[type] || 'Local';

const isGlobalCategory = type => getCategoryType(type) === 'Global';
const isIgnoredCategory = type => getCategoryType(type) === 'Ignore';
const isLocalCategory = type => getCategoryType(type) === 'Local';

module.exports = {
  getCategoryType,
  isGlobalCategory,
  isIgnoredCategory,
  isLocalCategory,
};
