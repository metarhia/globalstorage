'use strict';
/* eslint-env browser */

const common = require('metarhia-common');
const metasync = require('metasync');
const { StorageProvider } = require('./provider');
const { PostponedCursor } = require('./postponed.cursor');

function IndexedDBProvider() {}

common.inherits(IndexedDBProvider, StorageProvider);

const completeOptions = (opts = {}) => {
  let indexedDB = null;
  if (window) {
    indexedDB = window.indexedDB || window.mozIndexedDB ||
      window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  }
  if (!opts.indexedDB && !indexedDB) {
    return {
      err: new Error('There is no window.indexedDb and options.indexedDb')
    };
  }
  opts.indexedDB = opts.indexedDB || indexedDB;
  opts.databaseName = opts.databaseName || 'IndexedDBProviderDatabaseName';
  opts.storeName = opts.storeName || 'IndexedDBProviderStoreName';
  opts.idLabel = opts.idLabel || 'IndexedDBProvider_ID_Label';
  return { opts };
};

IndexedDBProvider.prototype.open = function(options, callback) {
  StorageProvider.prototype.open.call(this, options, () => {
    const { opts, err } = completeOptions(options);
    if (err) return callback(err);
    const request = opts.indexedDB.open(opts.databaseName);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(opts.storeName);
    };
    request.onsuccess = () => {
      this.db = request.result;
      this.get(opts.idLabel, (err, obj) => {
        if (err) return callback(err);
        if (obj) return callback(null);
        const tx = this.db.transaction(this.options.storeName, 'readwrite');
        const store = tx.objectStore(this.options.storeName);
        store.add({ idCounter: 0 }, opts.idLabel);
        tx.oncomplete = () => callback(null);
        tx.onerror = () => callback(tx.error);
      });
    };
    request.onerror = () => callback(request.error);
    this.request = request;
    this.options = opts;
  });
};

IndexedDBProvider.prototype.close = (callback) => {
  this.db.close();
  common.once(callback)(null);
};

IndexedDBProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  const tx = this.db.transaction(this.options.storeName, 'readwrite');
  const store = tx.objectStore(this.options.storeName);
  const idReq = store.get(this.options.idLabel);
  idReq.onsuccess = () => {
    const { idCounter } = idReq.result;
    const request = store.put({ idCounter: idCounter + 1 },
      this.options.idLabel);
    request.onsuccess = () => callback(null, idCounter);
    request.onerror = () => callback(request.error);
  };
  idReq.onerror = () => callback(idReq.error);
};

IndexedDBProvider.prototype.get = function(id, callback) {
  const tx = this.db.transaction(this.options.storeName);
  const store = tx.objectStore(this.options.storeName);
  const request = store.get(id);
  request.onerror = () => callback(request.error);
  request.onsuccess = () => {
    if (request.result === null || typeof(request.result) !== 'object') {
      return callback(null, request.result);
    }
    const obj = { id };
    Object.assign(obj, request.result);
    callback(null, obj);
  };
  return store;
};

IndexedDBProvider.prototype.create = function(obj, callback) {
  this.generateId((err, id) => {
    if (err) return callback(err);
    const tx = this.db.transaction(this.options.storeName, 'readwrite');
    const store = tx.objectStore(this.options.storeName);
    const request = store.add(obj, id);
    request.onerror = () => callback(request.error);
    request.onsuccess = () => callback(null, id);
  });
};

IndexedDBProvider.prototype.update = function(obj, callback) {
  const tx = this.db.transaction(this.options.storeName, 'readwrite');
  const store = tx.objectStore(this.options.storeName);
  const id = obj.id;
  delete obj.id;
  const request = store.put(obj, id);
  request.onerror = () => callback(request.error);
  request.onsuccess = () => {
    obj.id = id;
    callback(null, request.result);
  };
};

IndexedDBProvider.prototype.delete = function(id, callback) {
  const tx = this.db.transaction(this.options.storeName, 'readwrite');
  const store = tx.objectStore(this.options.storeName);
  const request = store.delete(id);
  request.onerror = () => callback(request.error);
  request.onsuccess = () => callback(null, request.result);
};

IndexedDBProvider.prototype.getAll = function(store, done) {
  const request = store.getAll();
  request.onerror = () => done(request.error);
  request.onsuccess = () => done(null, request.result);
};

const getAll = (store) => (data, done) => {
  const request = store.getAll();
  request.onerror = () => done(request.error);
  request.onsuccess = () => done(null, { all: request.result });
};

const getAllKeys = (store) => (data, done) => {
  const request = store.getAllKeys();
  request.onerror = () => done(request.error);
  request.onsuccess = () => done(null, { allKeys: request.result });
};

IndexedDBProvider.prototype.select = function(query, options) {
  const cursor = new PostponedCursor();
  cursor.provider = this;
  cursor.jsql.push({ op: 'select', query, options });

  const tx = this.db.transaction(this.options.storeName);
  const store = tx.objectStore(this.options.storeName);
  metasync([getAll(store), getAllKeys(store)])((err, data) => {
    const { all, allKeys } = data;
    const res = new Array(allKeys.length - 1);
    let j = 0;
    for (let i = 0; i < allKeys.length; i++) {
      if (allKeys[i] === this.options.idLabel) continue;
      const obj = all[i];
      obj.id = allKeys[i];
      res[j] = obj;
      j++;
    }
    cursor.resolve(res);
  });
  return cursor;
};

module.exports = { IndexedDBProvider };
