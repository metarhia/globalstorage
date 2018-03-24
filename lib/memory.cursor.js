'use strict';

const common = require('metarhia-common');

const operations = require('./operations');

function MemoryCursor(dataset) {
  MemoryCursor.super_.call(this);
  this.dataset = dataset;
  this.indices = {};
}

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

module.exports = gs => {
  common.inherits(MemoryCursor, gs.Cursor);
  gs.MemoryCursor = MemoryCursor;
};
