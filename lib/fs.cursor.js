'use strict';

const common = require('metarhia-common');

const Cursor = require('./cursor');

function FsCursor() {
  Cursor.call(this);
}

common.inherits(FsCursor, Cursor);

module.exports = FsCursor;
