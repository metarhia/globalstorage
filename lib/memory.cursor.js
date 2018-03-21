'use strict';

const common = require('metarhia-common');

const operations = require('./operations');
const Cursor = require('./cursor');

function MemoryCursor(provider, dataset) {
  this.provider = provider;
  this.dataset = dataset;
  this.jsql = [];
  this.index = {};
}

common.inherits(MemoryCursor, Cursor);

MemoryCursor.prototype.copy = function() {
  const ds = common.copy(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.clone = function() {
  const ds = common.clone(this.dataset);
  return new MemoryCursor(this.provider, ds);
};

MemoryCursor.prototype.empty = function() {
  this.dataset.length = 0;
  this.jsql.length = 0;
  return this;
};

MemoryCursor.prototype.from = function(arr) {
  this.dataset = common.clone(arr);
  return this;
};

MemoryCursor.prototype.count = function(done) {
  done = common.once(done);
  done(null, this.dataset.length);
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  done = common.once(done);
  let dataset = common.clone(this.dataset);
  this.jsql.forEach(operation => {
    const fn = operations[operation.op];
    if (fn) {
      dataset = fn(operation, dataset);
    }
  });
  this.jsql.length = 0;
  done(null, dataset);
  return this;
};

module.exports = MemoryCursor;
