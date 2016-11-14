'use strict';

module.exports = MongodbCursor;
var util = require('util');
var Cursor = require('./cursor.js');
util.inherits(MongodbCursor, Cursor);

// MongoDB Cursor
//
function MongodbCursor(cursor) {
  this.cursor = cursor;
  this.chain = [];
}

MongodbCursor.prototype.next = function() {
  //nextObject(function(err, item) {});
  return {
    done: false,
    value: null
  };
};

MongodbCursor.prototype.mapAsync = function(fn, done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.filterAsync = function(fn, done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.distinctAsync = function(done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.findAsync = function(fn, done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.sortAsync = function(fn, done) {
  done(new Error('Not implemented'));
  return this;
};

MongodbCursor.prototype.toArray = function(done) {
  console.dir({chain:this.chain});
  var i, item;
  for (i = 0; i < this.chain.length; i++) {
    item = this.chain[i];
    if (item.op === 'sort') {
    } else if (item.op === 'map') {
    } else if (item.op === 'column') {
    }
  }

/*
[
  { op: 'find', fn: { category: 'Buildings' } },
  { op: 'sort', fn: 'height' },
  { op: 'map', fn: [ 'id' ] },
  { op: 'column' }
]
*/

  done(null, this.chain);
  return this;
};
