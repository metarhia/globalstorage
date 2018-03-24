'use strict';

const common = require('metarhia-common');

function FsCursor() {
  FsCursor.super_.call(this);
}

module.exports = gs => {
  common.inherits(FsCursor, gs.Cursor);
  gs.FsCursor = FsCursor;
};
