'use strict';

const common = require('metarhia-common');

const operations = require('./operations');
const { Cursor } = require('./cursor');

class MemoryCursor extends Cursor {
  constructor(dataset, options) {
    super(options);
    this.dataset = dataset;
    this.indices = {};
  }

  copy() {
    const dataset = common.copy(this.dataset);
    return new MemoryCursor(dataset);
  }

  clone() {
    const dataset = common.clone(this.dataset);
    return new MemoryCursor(dataset);
  }

  empty() {
    this.dataset.length = 0;
    this.jsql.length = 0;
    return this;
  }

  from(arr) {
    this.dataset = common.copy(arr);
    return this;
  }

  count(done) {
    done = common.once(done);
    done(null, this.dataset.length);
    return this;
  }

  fetch(done) {
    done = common.once(done);

    const process = dataset => {
      this.jsql.forEach(operation => {
        const fn = operations[operation.op];
        if (fn) {
          dataset = fn(operation, dataset);
        }
      });
      this.jsql.length = 0;
      done(null, dataset, this);
    };

    if (this.parents.length) {
      const parent = this.parents[0];
      parent.fetch((err, dataset) => {
        if (err) {
          done(err);
          return;
        }
        process(dataset);
      });
    } else {
      const dataset = common.clone(this.dataset);
      process(dataset);
    }
    return this;
  }
}

Cursor.MemoryCursor = MemoryCursor;

module.exports = { MemoryCursor };
