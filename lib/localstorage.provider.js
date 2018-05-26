'use strict';

const common = require('metarhia-common');
const localStorage = require('localStorage');
const { StorageProvider } = require('./provider');
const { MemoryCursor } = require('./memory.cursor');

function LocalstorageProvider() {}

common.inherits(LocalstorageProvider, StorageProvider);

LocalstorageProvider.ID_LABEL = '_LocalstorageProviderId';
LocalstorageProvider.IDS_LABEL = '_LocalstorageProviderIds';
LocalstorageProvider.ID_ITEM_LABEL = '_LocalstorageProvider_item_';

LocalstorageProvider.prototype.close = (callback) => (
  common.once(callback)(null)
);

LocalstorageProvider.prototype.generateId = (callback) => {
  callback = common.once(callback);
  const id = +localStorage[LocalstorageProvider.ID_LABEL];
  localStorage[LocalstorageProvider.ID_LABEL] = id + 1;
  callback(null, id);
};

LocalstorageProvider.prototype.get = (id, callback) => {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + id;
  const obj = localStorage[key];
  callback(null, obj ? JSON.parse(obj) : obj);
};


LocalstorageProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) return callback(err);
    obj.id = id;
    const key = LocalstorageProvider.ID_ITEM_LABEL + id;
    localStorage[key] = JSON.stringify(obj);
    callback(null, id);
  });
};

LocalstorageProvider.prototype.update = (obj, callback) => {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + obj.id;
  localStorage[key] = JSON.stringify(obj);
  callback(null);
};

LocalstorageProvider.prototype.delete = (id, callback) => {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + id;
  localStorage.removeItem(key);
  callback(null);
};

LocalstorageProvider.prototype.select = (query, options) => {
  const ds = Object.keys(localStorage)
    .filter(id => id.startsWith(LocalstorageProvider.ID_ITEM_LABEL))
    .map(id => JSON.parse(localStorage[id]));
  const cursor = new MemoryCursor(ds);
  cursor.provider = this;
  cursor.jsql.push({ op: 'select', query, options });
  return cursor;
};

LocalstorageProvider.prototype.index = (def, callback) => {
  callback.once(callback)(null);
};

module.exports = { LocalstorageProvider };
