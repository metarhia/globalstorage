'use strict';

var util = require('util');
var transformations = require('./transformations.js');

module.exports = FsCursor;
var Cursor = require('./cursor.js');
util.inherits(FsCursor, Cursor);

// Filesystem Cursor
//
function FsCursor(cursor) {
  this.cursor = cursor;
  this.jsql = [];
}

FsCursor.prototype.next = function() {
  return {
    done: true,
    value: null
  };
};

FsCursor.prototype.map = function(fn) {
  return this;
};

FsCursor.prototype.projection = function(mapping) {
  return this;
};

FsCursor.prototype.filter = function(fn) {
  return this;
};

FsCursor.prototype.select = function(query) {
  return this;
};

FsCursor.prototype.distinct = function() {
  return this;
};

FsCursor.prototype.find = function(query, options) {
  return this;
};

FsCursor.prototype.sort = function(fn) {
  return this;
};

FsCursor.prototype.order = function(fields) {
  return this;
};

FsCursor.prototype.desc = function(fields) {
  return this;
};

FsCursor.prototype.toArray = function(done) {
  return this;
};

FsCursor.prototype.from = function(arr) {
  return this;
};
