'use strict';

var util = require('util');
var transformations = require('./transformations.js');

module.exports = MongodbCursor;
var Cursor = require('./cursor.js');
util.inherits(MongodbCursor, Cursor);

// MongoDB Cursor
//
function MongodbCursor(cursor) {
  this.cursor = cursor;
  this.jsql = [];
}

MongodbCursor.prototype.next = function() {
  //nextObject(function(err, item) {});
  return {
    done: true,
    value: null
  };
};

MongodbCursor.prototype.map = function(fn) {
  this.cursor.map(fn);
  this.jsql.push({ op: 'map', fn: fn });
  return this;
};

MongodbCursor.prototype.projection = function(mapping) {
  if (Array.isArray(mapping)) {
    var fields = {};
    mapping.forEach(function(field) {
      fields[field] = 1;
    });
    this.cursor.project(fields);
    this.jsql.push({ op: 'projection', fields: mapping });
  } else {
    this.jsql.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

MongodbCursor.prototype.filter = function(fn) {
  this.cursor.filter(fn);
  this.jsql.push({ op: 'filter', fn: fn });
  return this;
};

MongodbCursor.prototype.select = function(query) {
  // Not implemented
  this.jsql.push({ op: 'select', query: query });
  return this;
};

MongodbCursor.prototype.distinct = function() {
  // Not implemented
  this.jsql.push({ op: 'distinct' });
  return this;
};

MongodbCursor.prototype.find = function(query, options) {
  // Not implemented
  this.jsql.push({ op: 'find', query: query, options: options });
  return this;
};

MongodbCursor.prototype.sort = function(fn) {
  // Not implemented
  this.jsql.push({ op: 'sort', fn: fn });
  return this;
};

MongodbCursor.prototype.order = function(fields) {
  var order = {};
  if (typeof(fields) === 'string') {
    order[fields] = 1;
    this.cursor.sort(order);
    this.jsql.push({ op: 'order', fields: [fields] });
  } else {
    fields.forEach(function(field) {
      order[field] = 1;
    });
    this.cursor.sort(order);
    this.jsql.push({ op: 'order', fields: fields });
  }
  return this;
};

MongodbCursor.prototype.desc = function(fields) {
  var order = {};
  if (typeof(fields) === 'string') {
    order[fields] = -1;
    this.cursor.sort(order);
    this.jsql.push({ op: 'desc', fields: [fields] });
  } else {
    fields.forEach(function(field) {
      order[field] = -1;
    });
    this.cursor.sort(order);
    this.jsql.push({ op: 'desc', fields: fields });
  }
  return this;
};

MongodbCursor.prototype.toArray = function(done) {
  var mc = this;
  mc.cursor.toArray(function(err, data) {
    if (data) {
      mc.jsql.forEach(function(item) {
        if (item.op === 'projection') {
          data = transformations.projection(data);
        } else if (item.op === 'row') {
          data = transformations.row(data);
        } else if (item.op === 'col') {
          data = transformations.col(data);
        } else if (item.op === 'union') {
          item.cursor.toArray(function(err, data2) {
            data = data.concat(data2);
          });
        }
      });
      done(null, data);
      mc.jsql = {}; // TODO
    } else done(err);
  });
  return this;
};

MongodbCursor.prototype.from = function(arr) {
  return new Error('Not implemented');
};

MongodbCursor.prototype.count = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.sum = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.avg = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.max = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.min = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.median = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.mode = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.limit = function(n) {
  this.cursor.limit(n);
  this.jsql.push({ op: 'limit', count: n});
  return this;
};
