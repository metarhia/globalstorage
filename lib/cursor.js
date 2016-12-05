'use strict';

var NOT_IMPLEMENTED = 'Not implemented';

module.exports = Cursor;

// Global Storage Cursor
//
function Cursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

// Copy Cursor
//
Cursor.prototype.copy = function() {
  return new Error(NOT_IMPLEMENTED);
};

// Clone Cursor
//
Cursor.prototype.clone = function() {
  return new Error(NOT_IMPLEMENTED);
};

// Enroll JSQL to Cursor
//
Cursor.prototype.enroll = function(jsql) {
  return new Error(NOT_IMPLEMENTED);
};

// Empty Cursor
//
Cursor.prototype.empty = function() {
  return new Error(NOT_IMPLEMENTED);
};


// Synchronous virtualization converts Array to Cursor
//   arr - array or iterable
//   return - Cursor instance
//
Cursor.prototype.from = function(arr) {
  return this;
};

// Lazy functional mapping
//   fn - mapping function
//   return - Cursor instance
//
Cursor.prototype.map = function(fn) {
  this.jsql.push({ op: 'map', fn: fn });
  return this;
};

// Declarative lazy projection
//   mapping - projection metadata
//     array of field names or object describing mapping:
//     { toKey: [ fromKey, functions... ] }
//   return - Cursor instance
//
Cursor.prototype.projection = function(mapping) {
  if (Array.isArray(mapping)) {
    // Array of field names
    this.jsql.push({ op: 'projection', fields: mapping });
  } else {
    // Object describing mappings
    this.jsql.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

// Lazy functional filter
//   fn - filtering function
//   return - Cursor instance
//
Cursor.prototype.filter = function(fn) {
  this.jsql.push({ op: 'filter', fn: fn });
  return this;
};

// Declarative lazy filter
//   query - filter expression
//   return - Cursor instance
//
Cursor.prototype.select = function(query) {
  this.jsql.push({ op: 'select', query: query });
  return this;
};

// Lazy functional distinct filter
//   return - Cursor instance
//
Cursor.prototype.distinct = function() {
  this.jsql.push({ op: 'distinct' });
  return this;
};

// Lazy functional find (legacy)
//   query - find expression
//   options - find options
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.find = function(query, options) {
  this.jsql.push({ op: 'find', query: query, options: options });
  return this;
};

// Lazy functional dort
//   fn - compare function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.sort = function(fn) {
  this.jsql.push({ op: 'sort', fn: fn });
  return this;
};

// Declarative lazy ascending sort
//   fields - field name or array of names
//   return - Cursor instance
//
Cursor.prototype.order = function(fields) {
  if (typeof(fields) === 'string') {
    this.jsql.push({ op: 'order', fields: [fields] });
  } else {
    this.jsql.push({ op: 'order', fields: fields });
  }
  return this;
};

// Declarative lazy descending sort
//   fields - field name or array of names
//   return - Cursor instance
//
Cursor.prototype.desc = function(fields) {
  if (typeof(fields) === 'string') {
    this.jsql.push({ op: 'desc', fields: [fields] });
  } else {
    this.jsql.push({ op: 'desc', fields: fields });
  }
  return this;
};

// Asynchronous materialization converts Cursor to Array
//   done(err, arr) - callback on done
//
Cursor.prototype.toArray = function(done) {
  done(null, this.jsql);
  return this;
};

Cursor.prototype.count = function(done) {
  done();
  return this;
};

Cursor.prototype.sum = function(done) {
  done();
  return this;
};

Cursor.prototype.avg = function(done) {
  done();
  return this;
};

Cursor.prototype.max = function(done) {
  done();
  return this;
};

Cursor.prototype.min = function(done) {
  done();
  return this;
};

Cursor.prototype.median = function(done) {
  done();
  return this;
};

Cursor.prototype.mode = function(done) {
  done();
  return this;
};

// Convert first column of dataset to Cursor
//
Cursor.prototype.col = function() {
  this.jsql.push({ op: 'col' });
  return this;
};

// Convert first row of dataset to Cursor
//
Cursor.prototype.row = function() {
  this.jsql.push({ op: 'row' });
  return this;
};

// Take just first record in dataset
//
Cursor.prototype.one = function() {
  this.jsql.push({ op: 'one' });
  return this;
};

// Take top N elements
//
Cursor.prototype.limit = function(n) {
  this.jsql.push({ op: 'limit', count: n });
  return this;
};

// Calculate union with Cursor
//
Cursor.prototype.union = function(cursor) {
  this.jsql.push({ op: 'union', cursor: cursor });
  return this;
};

// Calculate intersection with Cursor
//
Cursor.prototype.intersection = function(cursor) {
  this.jsql.push({ op: 'intersection', cursor: cursor });
  return this;
};

// Calculate difference with Cursor
//
Cursor.prototype.difference = function(cursor) {
  this.jsql.push({ op: 'difference', cursor: cursor });
  return this;
};

// Calculate complement with Cursor
//
Cursor.prototype.complement = function(cursor) {
  this.jsql.push({ op: 'complement', cursor: cursor });
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

// Iterable protocol .next() implementation
//
Cursor.prototype.next = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};
