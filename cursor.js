'use strict';

module.exports = Cursor;

// Global Storage Cursor
//
function Cursor(storageProvider) {
  this.storage = storageProvider;
  this.chain = [];
}

// Iterable protocol .next() implementation
//
Cursor.prototype.next = function() {
  return new Error('Not implemented');
};

// Lazy functional mapping
//   fn - mapping function
//   return - Cursor instance
//
Cursor.prototype.map = function(fn) {
  this.chain.push({ op: 'map', fn: fn });
  return this;
};

// Asynchronous functional mapping
//   fn - mapping function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.mapAsync = function(fn, done) {
  done(new Error('Not implemented'));
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
    this.chain.push({ op: 'projection', fields: mapping });
  } else {
    // Object describing mappings
    this.chain.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

// Lazy functional filter
//   fn - filtering function
//   return - Cursor instance
//
Cursor.prototype.filter = function(fn) {
  this.chain.push({ op: 'filter', fn: fn });
  return this;
};

// Asynchronous functional filter
//   fn - filtering function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.filterAsync = function(fn, done) {
  done(new Error('Not implemented'));
  return this;
};

// Declarative lazy filter
//   query - filter expression
//   return - Cursor instance
//
Cursor.prototype.select = function(query) {
  this.chain.push({ op: 'select', query: query });
  return this;
};

// Lazy functional distinct filter
//   return - Cursor instance
//
Cursor.prototype.distinct = function() {
  this.chain.push({ op: 'distinct' });
  return this;
};

// Asynchronous functional distinct filter
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.distinctAsync = function(done) {
  done(new Error('Not implemented'));
  return this;
};

// Lazy functional find (legacy)
//   query - find expression
//   options - find options
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.find = function(query, options) {
  this.chain.push({ op: 'find', query: query, options: options });
  return this;
};

// Asynchronous functional find (legacy)
//   query - find expression
//   options - find options
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.findAsync = function(query, options, done) {
  done(new Error('Not implemented'));
  return this;
};

// Lazy functional dort
//   fn - compare function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.sort = function(fn) {
  this.chain.push({ op: 'sort', fn: fn });
  return this;
};

// Asynchronous functional sort
//   fn - compare function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.sortAsync = function(fn, done) {
  done(new Error('Not implemented'));
  return this;
};

// Declarative lazy sort
//   order - field name or array of names
//   return - Cursor instance
//
Cursor.prototype.order = function(order) {
  if (typeof(done) === 'string') {
    this.chain.push({ op: 'sort', order: [order] });
  } else {
    this.chain.push({ op: 'sort', odrder: order });
  }
  return this;
};

// Asynchronous materialization converts Cursor to Array
//   done(err, arr) - callback on done
//
Cursor.prototype.toArray = function(done) {
  done(null, this.chain);
  return this;
};

// Synchronous virtualization converts Array to Cursor
//   arr - array or iterable
//   return - Cursor instance
//
Cursor.prototype.from = function(arr) {
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

Cursor.prototype.column = function() {
  this.chain.push({ op: 'column' });
  return this;
};

Cursor.prototype.row = function() {
  this.chain.push({ op: 'row' });
  return this;
};
