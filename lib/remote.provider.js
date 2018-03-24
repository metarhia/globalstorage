'use strict';

const common = require('metarhia-common');

const { StorageProvider } = require('./provider');

function RemoteProvider() {
  StorageProvider.call(this);
}

common.inherits(RemoteProvider, StorageProvider);

module.exports = { RemoteProvider };
