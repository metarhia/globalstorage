'use strict';

const util = require('util');
const transformations = require('./transformations.js');
const NOT_IMPLEMENTED = 'Not implemented';

module.exports = MemoryCursor;
const Cursor = require('./cursor.js');
util.inherits(MemoryCursor, Cursor);

function MemoryCursor(provider, dataset) {
  this.provider = provider;
  this.dataset = dataset;
  this.jsql = [];
  this.index = {};
}

MemoryCursor.prototype.copy = function() {
  const ds = transformations.copy(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.clone = function() {
  const ds = transformations.clone(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.enroll = function(jsql) {
  this.jsql = jsql;
  return this;
};

MemoryCursor.prototype.empty = function() {
  this.dataset = [];
  this.jsql = [];
  return this;
};

MemoryCursor.prototype.next = function() {
  return {
    done: true,
    value: null
  };
};

MemoryCursor.prototype.from = function(arr) {
  this.dataset = transformations.clone(arr);
  return this;
};

MemoryCursor.prototype.map = function(fn, immediate) {
  if (immediate) {
    this.dataset = this.dataset.map(fn);
  } else {
    this.jsql.push({ op: 'map', fn });
  }
  return this;
};

MemoryCursor.prototype.projection = function(mapping, immediate) {
  if (immediate) {
    this.dataset = transformations.projection(mapping);
  } else {
    this.jsql.push({ op: 'projection', fields: mapping });
  }
  return this;
};

MemoryCursor.prototype.filter = function(fn, immediate) {
  if (immediate) {
    this.dataset = this.dataset.filter(fn);
  } else {
    this.jsql.push({ op: 'find', fn });
  }
  return this;
};

MemoryCursor.prototype.select = function(
  query, // declarative query
  immediate // bool, default false
) {
  if (immediate) {
    const fields = Object.keys(query);
    this.dataset = this.dataset.filter(record => {
      let keep = true;
      let i, j, field, conditions, condition;
      for (i = 0; i < fields.length; i++) {
        field = fields[i];
        condition = query[field];
        if (Array.isArray(condition[0])) {
          conditions = condition;
          for (j = 0; j < conditions.length; j++) {
            condition = conditions[j];
            keep = keep && transformations.compare(record, field, condition);
          }
        } else {
          keep = keep && transformations.compare(record, field, condition);
        }
      }
      return keep;
    });
  } else {
    this.jsql.push({ op: 'select', query });
  }
  return this;
};

MemoryCursor.prototype.distinct = function(
  fields, // string or array of strings
  immediate // bool, default false
) {
  const keys = new Set();
  if (typeof(fields) === 'string') fields = [fields];
  if (immediate) {
    this.dataset = this.dataset.filter(record => {
      const cols = fields || Object.keys(record).sort();
      const key = cols.map(field => record[field]).join('\x00');
      const has = keys.has(key);
      keys.add(key);
      return !has;
    });
  } else {
    this.jsql.push({ op: 'distinct', fields });
  }
  return this;
};

MemoryCursor.prototype.find = function(fn, immediate) {
  if (immediate) {
    this.dataset = [this.dataset.find(fn)];
  } else {
    this.jsql.push({ op: 'find', fn });
  }
  return this;
};

MemoryCursor.prototype.sort = function(fn, immediate) {
  if (immediate) {
    this.dataset.sort(fn);
  } else {
    this.jsql.push({ op: 'sort', fn });
  }
  return this;
};

MemoryCursor.prototype.order = function(fields, immediate) {
  if (typeof(fields) === 'string') fields = [fields];
  if (immediate) {
    this.dataset.sort((r1, r2) => {
      const a1 = fields.map(field => r1[field]).join('\x00');
      const a2 = fields.map(field => r2[field]).join('\x00');
      /**/ if (a1 < a2) return -1;
      else if (a1 > a2) return 1;
      else return 0;
    });
  } else {
    this.jsql.push({ op: 'order', fields });
  }
  return this;
};

MemoryCursor.prototype.desc = function(fields, immediate) {
  if (typeof(fields) === 'string') fields = [fields];
  if (immediate) {
    this.dataset.sort((r1, r2) => {
      const a1 = fields.map(field => r1[field]).join('\x00');
      const a2 = fields.map(field => r2[field]).join('\x00');
      /**/ if (a1 < a2) return 1;
      else if (a1 > a2) return -1;
      else return 0;
    });
  } else {
    this.jsql.push({ op: 'desc', fields });
  }
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  const ds = transformations.clone(this.dataset);
  done(null, ds);
  return this;
};

MemoryCursor.prototype.next = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};
