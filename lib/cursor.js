'use strict';

const common = require('metarhia-common');

const constants = require('./constants');

function Cursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

Cursor.prototype.copy = function() {
  console.log(
    'Cursor.prototype.copy()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

Cursor.prototype.clone = function() {
  console.log(
    'Cursor.prototype.clone()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

Cursor.prototype.enroll = function(
  jsql // enroll JSQL to Cursor instance
) {
  console.log(
    'Cursor.prototype.enroll(', jsql, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

Cursor.prototype.empty = function() {
  console.log(
    'Cursor.prototype.empty()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

Cursor.prototype.from = function(
  // Synchronous virtualization converts Array to Cursor
  arr // array or iterable
  // Return: Cursor instance
) {
  console.log(
    'Cursor.prototype.from(', arr, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

Cursor.prototype.map = function(
  // Lazy map
  fn // map function
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'map', fn });
  return this;
};

Cursor.prototype.projection = function(
  // Declarative lazy projection
  mapping // projection metadata array of field names
  // or structure: [ { toKey: [ fromKey, functions... ] } ]
  // Return: Cursor instance
) {
  if (Array.isArray(mapping)) {
    // Array of field names
    this.jsql.push({ op: 'projection', fields: mapping });
  } else {
    // Object describing mappings
    this.jsql.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

Cursor.prototype.filter = function(
  // Lazy functional filter
  fn // filtering function
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'filter', fn });
  return this;
};

Cursor.prototype.select = function(
  // Declarative lazy filter
  query // filter expression
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'select', query });
  return this;
};

Cursor.prototype.distinct = function(
  // Lazy functional distinct filter
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'distinct' });
  return this;
};

Cursor.prototype.find = function(
  // Lazy functional find (legacy)
  query, // find expression
  options, // find options
  done // callback on done function(err, arr)
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'find', query, options, done });
  return this;
};

Cursor.prototype.sort = function(
  // Lazy functional dort
  fn, // compare function
  done // callback on done function(err, arr)
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'sort', fn, done });
  return this;
};

Cursor.prototype.order = function(
  // Declarative lazy ascending sort
  fields // field name or array of names
  // Return: Cursor instance
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'order', fields });
  return this;
};

Cursor.prototype.desc = function(
  // Declarative lazy descending sort
  fields // field name or array of names
  // Return: Cursor instance
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'desc', fields });
  return this;
};

Cursor.prototype.count = function(
  done // callback on done function(err, count)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.sum = function(
  done // callback on done function(err, sum)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.avg = function(
  done // callback on done function(err, avg)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.max = function(
  done // callback on done function(err, max)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.min = function(
  done // callback on done function(err, min)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.median = function(
  done // callback on done function(err, median)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.mode = function(
  done // callback on done function(err, mode)
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.col = function(
  // Convert first column of dataset to Cursor
) {
  this.jsql.push({ op: 'col' });
  return this;
};

Cursor.prototype.row = function(
  // Convert first row of dataset to Cursor
) {
  this.jsql.push({ op: 'row' });
  return this;
};

Cursor.prototype.one = function() {
  this.jsql.push({ op: 'one' });
  return this;
};

Cursor.prototype.limit = function(n) {
  this.jsql.push({ op: 'limit', count: n });
  return this;
};

Cursor.prototype.union = function(cursor) {
  this.jsql.push({ op: 'union', cursor });
  return this;
};

Cursor.prototype.intersection = function(cursor) {
  this.jsql.push({ op: 'intersection', cursor });
  return this;
};

Cursor.prototype.difference = function(cursor) {
  this.jsql.push({ op: 'difference', cursor });
  return this;
};

Cursor.prototype.complement = function(cursor) {
  this.jsql.push({ op: 'complement', cursor });
  return this;
};

Cursor.prototype.fetch = function(done) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.toArray = function(done) {
  console.log('Cursor.toArray() is deprecated use Cursor.fetch() instead');
  this.fetch(done);
  return this;
};

Cursor.prototype.next = function(
  // Iterable protocol .next() implementation
  done
) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

module.exports = Cursor;
