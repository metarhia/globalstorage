'use strict';

var util = require('util');
var transformations = require('./transformations.js');

module.exports = MemoryCursor;
var Cursor = require('./cursor.js');
util.inherits(MemoryCursor, Cursor);

// MongoDB Cursor
//
function MemoryCursor(dataset) {
  this.dataset = dataset;
  this.jsql = [];
}

MemoryCursor.prototype.copy = function() {
  var ds = transformations.copy(this.dataset);
  return new MemoryCursor(ds);
};

MemoryCursor.prototype.clone = function() {
  var ds = transformations.clone(this.dataset);
  return new MemoryCursor(ds);
};

MemoryCursor.prototype.enroll = function(jsql) {
  return this;
};

MemoryCursor.prototype.empty = function() {
  return this;
};

MemoryCursor.prototype.next = function() {
  return {
    done: true,
    value: null
  };
};

MemoryCursor.prototype.from = function(arr) {
  return this;
};

MemoryCursor.prototype.map = function(fn) {
  return this;
};

MemoryCursor.prototype.projection = function(mapping) {
  return this;
};

MemoryCursor.prototype.filter = function(fn) {
  return this;
};

MemoryCursor.prototype.select = function(query) {
  return this;
};

MemoryCursor.prototype.distinct = function() {
  return this;
};

MemoryCursor.prototype.find = function(query, options) {
  return this;
};

MemoryCursor.prototype.sort = function(fn) {
  return this;
};

MemoryCursor.prototype.order = function(fields) {
  return this;
};

MemoryCursor.prototype.desc = function(fields) {
  return this;
};

MemoryCursor.prototype.toArray = function(done) {
  return this;
};

