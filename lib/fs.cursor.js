'use strict';

const common = require('metarhia-common');

const Cursor = require('./cursor');

function FsCursor(provider) {
  this.provider = provider;
  this.jsql = [];
}

common.inherits(FsCursor, Cursor);

module.exports = FsCursor;
