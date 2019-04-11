'use strict';

const common = require('@metarhia/common');

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

  async fetch() {
    const process = dataset => {
      this.jsql.forEach(operation => {
        const fn = operations[operation.op];
        dataset = fn(operation, dataset);
      });
      this.jsql.length = 0;
      return dataset;
    };

    let dataset;
    if (this.parents.length) {
      const parent = this.parents[0];
      dataset = await parent.fetch();
    } else {
      dataset = common.duplicate(this.dataset);
    }
    return process(dataset);
  }
}

module.exports = { MemoryCursor };
