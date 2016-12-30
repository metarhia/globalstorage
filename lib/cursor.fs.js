'use strict';

const util = require('util');
const transformations = require('./transformations.js');
const NOT_IMPLEMENTED = 'Not implemented';

module.exports = FsCursor;
const Cursor = require('./cursor.js');
util.inherits(FsCursor, Cursor);

// Filesystem Cursor
//
function FsCursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

FsCursor.prototype.copy = function() {
  return this;
};

FsCursor.prototype.clone = function() {
  return this;
};

FsCursor.prototype.enroll = function(jsql) {
  return this;
};

FsCursor.prototype.empty = function() {
  return this;
};


FsCursor.prototype.from = function(arr) {
  return this;
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

FsCursor.prototype.find = function(fn) {
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

FsCursor.prototype.fetch = function(done) {
  return this;
};

FsCursor.prototype.next = function(done) {
  return this;
};
