'use strict';

const util = require('util');
const transformations = require('./transformations.js');
const NOT_IMPLEMENTED = 'Not implemented';

module.exports = MemoryCursor;
const Cursor = require('./cursor.js');
util.inherits(MemoryCursor, Cursor);

// MongoDB Cursor
//
function MemoryCursor(provider, dataset) {
  this.provider = provider;
  this.dataset = dataset;
  this.jsql = [];
  this.index = {};
}

MemoryCursor.prototype.copy = function() {
  let ds = transformations.copy(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.clone = function() {
  let ds = transformations.clone(this.dataset);
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
    this.jsql.push({ op: 'map', fn: fn });
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
    this.jsql.push({ op: 'find', fn: fn });
  }
  return this;
};

MemoryCursor.prototype.select = function(query, immediate) {
  if (immediate) {
    this.dataset = this.dataset.filter(item => true);
  } else {
    this.jsql.push({ op: 'select', query: query });
  }
  return this;
};

MemoryCursor.prototype.distinct = function(immediate) {
  if (immediate) {
    // TODO
  } else {
    this.jsql.push({ op: 'distinct' });
  }
  return this;
};

MemoryCursor.prototype.find = function(fn, immediate) {
  if (immediate) {
    // TODO
  } else {
    this.jsql.push({ op: 'find', fn: fn });
  }
  return this;
};

MemoryCursor.prototype.sort = function(fn, immediate) {
  if (immediate) {
    // TODO
  } else {
    this.jsql.push({ op: 'sort', fn: fn });
  }
  return this;
};

MemoryCursor.prototype.order = function(fields, immediate) {
  if (immediate) {
    let order = {};
    if (typeof(fields) === 'string') {
      order[fields] = 1;
      this.jsql.push({ op: 'order', fields: [fields] });
    } else {
      fields.forEach(field => order[field] = 1);
    }
  } else {
    this.jsql.push({ op: 'order', fields: fields });
  }
  return this;
};

MemoryCursor.prototype.desc = function(fields, immediate) {
  if (immediate) {
    let order = {};
    if (typeof(fields) === 'string') {
      order[fields] = -1;
      this.jsql.push({ op: 'desc', fields: [fields] });
    } else {
      fields.forEach(field => order[field] = -1);
    }
  } else {
    this.jsql.push({ op: 'desc', fields: fields });
  }
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  let ds = transformations.clone(this.dataset);
  done(null, ds);
  return this;
};

MemoryCursor.prototype.next = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};
