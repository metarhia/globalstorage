'use strict';

const common = require('metarhia-common');

const core = require('./core');
const Cursor = require('./cursor');

function FsCursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

common.inherits(FsCursor, Cursor);

FsCursor.prototype.fetch = function(done) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

module.exports = FsCursor;
