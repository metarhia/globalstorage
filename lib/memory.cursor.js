'use strict';

const common = require('metarhia-common');

const operations = require('./operations');
const Cursor = require('./cursor');

function MemoryCursor(dataset) {
  Cursor.call(this);
  this.dataset = dataset;
  this.indices = {};
}

common.inherits(MemoryCursor, Cursor);

MemoryCursor.prototype.copy = function() {
  const dataset = common.copy(this.dataset);
  return new MemoryCursor(dataset);
};

MemoryCursor.prototype.clone = function() {
  const dataset = common.clone(this.dataset);
  return new MemoryCursor(dataset);
};

MemoryCursor.prototype.empty = function() {
  this.dataset.length = 0;
  this.jsql.length = 0;
  return this;
};

MemoryCursor.prototype.from = function(arr) {
  this.dataset = common.copy(arr);
  return this;
};

MemoryCursor.prototype.select = function(
  query // filter expression
) {
  const cursor = Cursor.prototype.select.call(this, query);
  Object.setPrototypeOf(cursor, MemoryCursor.prototype);
  return cursor;
};

MemoryCursor.prototype.count = function(done) {
  done = common.once(done);
  done(null, this.dataset.length);
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  done = common.once(done);

  const process = dataset => {
    this.jsql.forEach(operation => {
      const fn = operations[operation.op];
      if (fn) {
        dataset = fn(operation, dataset);
      }
    });
    this.jsql.length = 0;
    done(null, dataset);
  };

  if (this.parent) {
    this.parent.fetch((err, dataset) => process(dataset));
  } else {
    const dataset = common.clone(this.dataset);
    process(dataset);
  }
  return this;
};

module.exports = MemoryCursor;
