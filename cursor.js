'use strict';

// Global Storage Cursor

module.exports = Cursor;

function Cursor() {
}

// Asynchronous functional mapping
//   Cursor.map(fn, done)
// Lazy functional mapping
//   Cursor.map(fn): Cursor
//
//   fn - mapping function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.map = function(fn, done) {
  if (typeof(done) === 'function') {
    // Asynchronous functional mapping
  } else {
    // Lazy functional mapping
  }
  done();
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
  } else {
    // Object describing mappings
  }
  return;
};

// Asynchronous functional filter
//   Cursor.filter(fn, done)
// Lazy functional filter
//   Cursor.filter(fn): Cursor
//
//   fn - filtering function
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.filter = function(fn, done) {
  if (typeof(done) === 'function') {
    // Asynchronous functional filter
  } else {
    // Lazy functional filter
  }
  done();
};

// Declarative lazy filter
//   query - filter expression
//   return - Cursor instance
//
Cursor.prototype.select = function(query) {
  return;
};

// Asynchronous functional distinct filter
//   Cursor.distinct(done)
// Lazy functional distinct filter
//   Cursor.distinct(): Cursor
//
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.distinct = function(done) {
  if (typeof(done) === 'function') {
    // Asynchronous functional filter
  } else {
    // Lazy functional filter
  }
  done();
};

// Asynchronous functional find (legacy)
//   Cursor.find(fn, done)
// Lazy functional find (legacy)
//   Cursor.find(fn): Cursor
//
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.find = function(fn, done) {
  if (typeof(done) === 'function') {
    // Asynchronous functional find
  } else {
    // Lazy functional find
  }
  done();
};

// Asynchronous functional sort
//   Cursor.sort(fn, done)
// Lazy functional dort
//   Cursor.sort(fn): Cursor
//
//   done(err, arr) - callback on done
//   return - Cursor instance
//
Cursor.prototype.sort = function(fn, done) {
  if (typeof(done) === 'function') {
    // Asynchronous functional sort
  } else {
    // Lazy functional sort
  }
  done();
};

// Declarative lazy sort
//   order - field name or array of names
//   return - Cursor instance
//
Cursor.prototype.order = function(order) {
  if (typeof(done) === 'string') {
    // Single field
  } else {
    // Lazy functional sort
  }
};

// Asynchronous materialization converts Cursor to Array
//   done(err, arr) - callback on done
//
Cursor.prototype.toArray = function(done) {
  done();
};

// Synchronous virtualization converts Array to Cursor
//   arr - array or iterable
//   return - Cursor instance
//
Cursor.prototype.from = function(arr) {
  return;
};

Cursor.prototype.count = function(done) {
  done();
};

Cursor.prototype.sum = function(done) {
  done();
};

Cursor.prototype.avg = function(done) {
  done();
};

Cursor.prototype.max = function(done) {
  done();
};

Cursor.prototype.min = function(done) {
  done();
};

Cursor.prototype.median = function(done) {
  done();
};

Cursor.prototype.mode = function(done) {
  done();
};

Cursor.prototype.column = function() {
  return;
};

Cursor.prototype.row = function() {
  return;
};
