'use strict';

const NOT_IMPLEMENTED = 'Not implemented';

module.exports = Cursor;

function Cursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

Cursor.prototype.copy = function() {
  return new Error(NOT_IMPLEMENTED);
};

Cursor.prototype.clone = function() {
  return new Error(NOT_IMPLEMENTED);
};

Cursor.prototype.enroll = function(
  jsql // enroll JSQL to Cursor instance
) {
  return new Error(NOT_IMPLEMENTED);
};

Cursor.prototype.empty = function() {
  return new Error(NOT_IMPLEMENTED);
};

Cursor.prototype.from = function(
  // Synchronous virtualization converts Array to Cursor
  arr // array or iterable
  // Return: Cursor instance
) {
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
  this.jsql.push({ op: 'find', query, options });
  return this;
};

Cursor.prototype.sort = function(
  // Lazy functional dort
  fn, // compare function
  done // callback on done function(err, arr)
  // Return: Cursor instance
) {
  this.jsql.push({ op: 'sort', fn });
  return this;
};

Cursor.prototype.order = function(
  // Declarative lazy ascending sort
  fields // field name or array of names
  // Return: Cursor instance
) {
  if (typeof(fields) === 'string') {
    this.jsql.push({ op: 'order', fields: [fields] });
  } else {
    this.jsql.push({ op: 'order', fields });
  }
  return this;
};

Cursor.prototype.desc = function(
  // Declarative lazy descending sort
  fields // field name or array of names
  // Return: Cursor instance
) {
  if (typeof(fields) === 'string') {
    this.jsql.push({ op: 'desc', fields: [fields] });
  } else {
    this.jsql.push({ op: 'desc', fields });
  }
  return this;
};

Cursor.prototype.toArray = function(
  // Asynchronous materialization converts Cursor to Array
  done // callback on done function(err, arr)
) {
  done(null, this.jsql);
  return this;
};

Cursor.prototype.count = function(
  done // callback on done function(err, count)
) {
  done();
  return this;
};

Cursor.prototype.sum = function(
  done // callback on done function(err, sum)
) {
  done();
  return this;
};

Cursor.prototype.avg = function(
  done // callback on done function(err, avg)
) {
  done();
  return this;
};

Cursor.prototype.max = function(
  done // callback on done function(err, max)
) {
  done();
  return this;
};

Cursor.prototype.min = function(
  done // callback on done function(err, min)
) {
  done();
  return this;
};

Cursor.prototype.median = function(
  done // callback on done function(err, median)
) {
  done();
  return this;
};

Cursor.prototype.mode = function(
  done // callback on done function(err, mode)
) {
  done();
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
  if (done) done(new Error(NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.toArray = function(done) {
  console.log('Cursor.toArray() is deprecated use Cursor.fetch() instead');
  return this.fetch(done);
};

Cursor.prototype.next = function(
  // Iterable protocol .next() implementation
  done
) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};
