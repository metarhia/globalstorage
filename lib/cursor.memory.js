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
  query, // function
  immediate // bool, default false
) {
  if (immediate) {
    this.dataset = this.dataset.filter(query);
  } else {
    this.jsql.push({ op: 'select', query });
  }
  return this;
};

MemoryCursor.prototype.distinct = function(
  fields, // string or array of strings
  immediate // bool, default false
) {
  if (typeof(fields) === 'string') {
    // single field
  } else {
    // Array with multiple fields
  }
  if (immediate) {
    // Apply distinct immediate
  } else {
    this.jsql.push({ op: 'distinct' });
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
      const a1 = fields.map(field => r1[field]).join('\t');
      const a2 = fields.map(field => r2[field]).join('\t');
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
      const a1 = fields.map(field => r1[field]).join('\t');
      const a2 = fields.map(field => r2[field]).join('\t');
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
