'use strict';

const common = require('metarhia-common');

const { Cursor } = require('./cursor');

function RemoteCursor() {
  Cursor.call(this);
}

common.inherits(RemoteCursor, Cursor);

module.exports = { RemoteCursor };
