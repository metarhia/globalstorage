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

FsCursor.prototype.fetch = function(done) {
  done = common.once(done);
  done(new Error(constants.NOT_IMPLEMENTED));
  return this;
};

module.exports = FsCursor;
