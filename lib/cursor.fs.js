'use strict';

const util = require('util');

const common = require('metarhia-common');

const constants = require('./constants');
const Cursor = require('./cursor');

function FsCursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

util.inherits(FsCursor, Cursor);

FsCursor.prototype.copy = function() {
  console.log(
    'FsCursor.prototype.copy()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.clone = function() {
  console.log(
    'FsCursor.prototype.clone()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.enroll = function(jsql) {
  console.log(
    'FsCursor.prototype.enroll(', jsql, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  console.dir({ jsql });
  return this;
};

FsCursor.prototype.empty = function() {
  console.log(
    'FsCursor.prototype.empty()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.from = function(arr) {
  console.log(
    'FsCursor.prototype.from(', arr, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.map = function(fn) {
  console.log(
    'FsCursor.prototype.map(', fn, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.projection = function(mapping) {
  console.log(
    'FsCursor.prototype.projection(', mapping, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.filter = function(fn) {
  console.log(
    'FsCursor.prototype.filter(', fn, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.select = function(query) {
  console.log(
    'FsCursor.prototype.select(', query, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.distinct = function() {
  console.log(
    'FsCursor.prototype.distinct()',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.find = function(fn) {
  console.log(
    'FsCursor.prototype.find(', fn, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.sort = function(fn) {
  console.log(
    'FsCursor.prototype.sort(', fn, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.order = function(fields) {
  console.log(
    'FsCursor.prototype.order(', fields, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.desc = function(fields) {
  console.log(
    'FsCursor.prototype.desc(', fields, ')',
    new Error(constants.NOT_IMPLEMENTED)
  );
  return this;
};

FsCursor.prototype.fetch = function(done) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

FsCursor.prototype.next = function(done) {
  done = common.cb(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

module.exports = FsCursor;
