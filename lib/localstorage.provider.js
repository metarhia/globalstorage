'use strict';
/* eslint-env browser */

const common = require('metarhia-common');
const { StorageProvider } = require('./provider');
const { MemoryCursor } = require('./memory.cursor');

function LocalstorageProvider() {}

common.inherits(LocalstorageProvider, StorageProvider);

// Key of object containing current global id
LocalstorageProvider.ID_LABEL = '_LocalstorageProviderId';
// Prefix for globalstorage objects in localstorage
LocalstorageProvider.ID_ITEM_LABEL = '_LocalstorageProvider_item_';

LocalstorageProvider.prototype.open = function(options = {}, callback) {
  StorageProvider.prototype.open.call(this, options, () => {
    let localStorage = null;
    if (window) localStorage = window.localStorage;
    if (!options.localStorage && !localStorage) {
      const err =
        new Error('There is no window.indexedDb and options.indexedDb');
      return callback(err);
    }
    options.localStorage = options.localStorage || localStorage;
    this.options = options;
    this.localStorage = options.localStorage;
    callback(null);
  });
};

LocalstorageProvider.prototype.close = (callback) => (
  common.once(callback)(null)
);

LocalstorageProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  const id = +this.localStorage[LocalstorageProvider.ID_LABEL];
  this.localStorage[LocalstorageProvider.ID_LABEL] = id + 1;
  callback(null, id);
};

LocalstorageProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + id;
  const obj = this.localStorage[key];
  callback(null, obj ? JSON.parse(obj) : obj);
};


LocalstorageProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) return callback(err);
    obj.id = id;
    const key = LocalstorageProvider.ID_ITEM_LABEL + id;
    this.localStorage[key] = JSON.stringify(obj);
    callback(null, id);
  });
};

LocalstorageProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + obj.id;
  this.localStorage[key] = JSON.stringify(obj);
  callback(null);
};

LocalstorageProvider.prototype.delete = function(id, callback) {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + id;
  this.localStorage.removeItem(key);
  callback(null);
};

LocalstorageProvider.prototype.select = function(query, options) {
  const ds = Object.keys(this.localStorage)
    .filter(id => id.startsWith(LocalstorageProvider.ID_ITEM_LABEL))
    .map(id => JSON.parse(this.localStorage[id]));
  const cursor = new MemoryCursor(ds);
  cursor.provider = this;
  cursor.jsql.push({ op: 'select', query, options });
  return cursor;
};

LocalstorageProvider.prototype.index = (def, callback) => {
  callback.once(callback)(null);
};

module.exports = { LocalstorageProvider };
