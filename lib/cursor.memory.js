'use strict';

const util = require('util');
const common = require('metarhia-common');
const operations = require('./operations');
const Cursor = require('./cursor');

function MemoryCursor(provider, dataset) {
  this.provider = provider;
  this.dataset = dataset;
  this.jsql = [];
  this.index = {};
}

util.inherits(MemoryCursor, Cursor);

MemoryCursor.prototype.copy = function() {
  const ds = common.copy(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.clone = function() {
  const ds = common.clone(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.enroll = function(jsql) {
  this.jsql = jsql;
  return this;
};

MemoryCursor.prototype.empty = function() {
  this.dataset = [];
  this.jsql = [];
  return this;
};

MemoryCursor.prototype.from = function(arr) {
  this.dataset = common.clone(arr);
  return this;
};

MemoryCursor.prototype.count = function(
  done // callback on done function(err, count)
) {
  done = common.once(done);
  done(null, this.dataset.length);
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  done = common.once(done);
  let dataset = common.clone(this.dataset);
  this.jsql.forEach(operation => {
    const fn = operations[operation.op];
    dataset = fn(operation, dataset);
  });
  done(null, dataset);
  this.jsql = {};
  return this;
};

module.exports = MemoryCursor;
