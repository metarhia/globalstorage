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

const isGlobal = type => getCategoryType(type) === 'Global';
const isIgnored = type => getCategoryType(type) === 'Ignore';
const isLocal = type => getCategoryType(type) === 'Local';

module.exports = {
  getCategoryType,
  isGlobal,
  isIgnored,
  isLocal,
};
