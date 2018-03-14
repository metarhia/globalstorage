'use strict';

const util = require('util');

const common = require('metarhia-common');

const constants = require('./constants');
const operations = require('./operations');
const Cursor = require('./cursor');

function MemoryCursor(provider, dataset) {
  this.provider = provider;
  this.dataset = dataset;
  this.jsql = [];
  this.index = {};
}

util.inherits(MemoryCursor, Cursor);

MemoryCursor.prototype.copy = function() {
  const ds = common.copy(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.clone = function() {
  const ds = common.clone(this.dataset);
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

MemoryCursor.prototype.from = function(arr) {
  this.dataset = common.clone(arr);
  return this;
};

MemoryCursor.prototype.map = function(fn) {
  this.jsql.push({ op: 'map', fn });
  return this;
};

MemoryCursor.prototype.projection = function(mapping) {
  if (typeof(mapping) === 'string') mapping = [mapping];
  this.jsql.push({ op: 'projection', fields: mapping });
  return this;
};

MemoryCursor.prototype.filter = function(fn) {
  this.jsql.push({ op: 'find', fn });
  return this;
};

MemoryCursor.prototype.select = function(
  query // declarative query
) {
  this.jsql.push({ op: 'select', query });
  return this;
};

MemoryCursor.prototype.distinct = function(
  fields // string or array of strings
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'distinct', fields });
  return this;
};

MemoryCursor.prototype.find = function(fn) {
  this.jsql.push({ op: 'find', fn });
  return this;
};

MemoryCursor.prototype.sort = function(fn) {
  this.jsql.push({ op: 'sort', fn });
  return this;
};

MemoryCursor.prototype.order = function(fields) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'order', fields });
  return this;
};

MemoryCursor.prototype.desc = function(fields) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'desc', fields });
  return this;
};

MemoryCursor.prototype.count = function(
  done // callback on done function(err, count)
) {
  done = common.once(done);
  done(null, this.dataset.length);
  return this;
};

MemoryCursor.prototype.sum = function(
  done // callback on done function(err, sum)
) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

MemoryCursor.prototype.avg = function(
  done // callback on done function(err, avg)
) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

MemoryCursor.prototype.max = function(
  done // callback on done function(err, max)
) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

MemoryCursor.prototype.min = function(
  done // callback on done function(err, min)
) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

MemoryCursor.prototype.median = function(
  done // callback on done function(err, median)
) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

MemoryCursor.prototype.mode = function(
  done // callback on done function(err, mode)
) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

MemoryCursor.prototype.col = function(
  // Convert column of dataset to Cursor
) {
  this.jsql.push({ op: 'col' });
  return this;
};

MemoryCursor.prototype.row = function(
  // Convert first row of dataset to Cursor
) {
  this.jsql.push({ op: 'row' });
  return this;
};

MemoryCursor.prototype.one = function() {
  this.jsql.push({ op: 'one' });
  return this;
};

MemoryCursor.prototype.limit = function(n) {
  this.jsql.push({ op: 'limit', count: n });
  return this;
};

MemoryCursor.prototype.union = function(cursor) {
  this.jsql.push({ op: 'union', cursor });
  return this;
};

MemoryCursor.prototype.intersection = function(cursor) {
  this.jsql.push({ op: 'intersection', cursor });
  return this;
};

MemoryCursor.prototype.difference = function(cursor) {
  this.jsql.push({ op: 'difference', cursor });
  return this;
};

MemoryCursor.prototype.complement = function(cursor) {
  this.jsql.push({ op: 'complement', cursor });
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  done = common.once(done);
  let dataset = common.clone(this.dataset);
  this.jsql.forEach(operation => {
    const fn = operations[operation.op];
    dataset = fn(operation, dataset);
  });
  done(null, dataset);
  this.jsql = {};
  return this;
};

MemoryCursor.prototype.next = function(done) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

module.exports = MemoryCursor;
