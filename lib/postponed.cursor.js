'use strict';

const common = require('metarhia-common');
const { MemoryCursor } = require('./memory.cursor');

function PostponedCursor() {
  MemoryCursor.call(this, null);
  this.ds = new Promise((res, rej) => {
    this.dsResolve = res;
    this.dsReject = rej;
  });
}

common.inherits(PostponedCursor, MemoryCursor);

PostponedCursor.prototype.resolve = function(ds) {
  this.dsResolve(ds);
};

PostponedCursor.prototype.reject = function(err) {
  this.dsReject(err);
};

PostponedCursor.prototype.fetch = function(done) {
  this.ds.then(ds => {
    this.dataset = ds;
    MemoryCursor.prototype.fetch.call(this, done);
  });
};

module.exports = { PostponedCursor };
