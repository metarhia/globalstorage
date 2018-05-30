'use strict';

const common = require('metarhia-common');

const operations = require('./operations');
const { Cursor } = require('./cursor');

function FsCursor() {
  Cursor.call(this);
}

common.inherits(FsCursor, Cursor);

FsCursor.prototype.fetch = function(done) {
  done = common.once(done);

  this.jsql.forEach(operation => {
    const fn = operations[operation.op];
    if (fn) {
      this.dataset = fn(operation, this.dataset);
      this.jsql.length = 0;
      done(null, this.dataset);
    }
  });

  return this;
};

module.exports = { FsCursor };
