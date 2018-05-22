'use strict';

const common = require('metarhia-common');

function Transaction(data) {
  this.data = data;
  this.delta = {};
  this.deleteDelta = new Set();
  this.methods = {
    commit: this.commit.bind(this),
    rollback: this.rollback.bind(this),
    clone: this.clone.bind(this),
  };
  this.proxyMethods = {
    get: this.get.bind(this),
    getOwnPropertyDescriptor: this.getOwnPropertyDescriptor.bind(this),
    ownKeys: this.ownKeys.bind(this),
    set: this.set.bind(this),
    deleteProperty: this.deleteProperty.bind(this),
  };
}

Transaction.prototype.rollback = function() {
  this.delta = {};
  this.deleteDelta.clear();
};

Transaction.prototype.clone = function() {
  const cloned = new Transaction(this.data);
  Object.assign(cloned.delta, this.delta);
  cloned.deleteDelta = new Set(this.deleteDelta);
  return new Proxy(cloned.data, cloned.proxyMethods);
};

Transaction.prototype.commit = function() {
  for (const key of this.deleteDelta) {
    delete this.data[key];
  }
  Object.assign(this.data, this.delta);
  this.delta = {};
};

Transaction.prototype.get = function(target, key) {
  if (key === 'delta') return this.delta;
  if (this.methods.hasOwnProperty(key)) return this.methods[key];
  if (this.delta.hasOwnProperty(key)) return this.delta[key];
  return target[key];
};

Transaction.prototype.getOwnPropertyDescriptor = function(target, key) {
  return Object.getOwnPropertyDescriptor(
    this.delta.hasOwnProperty(key) ? this.delta : target, key
  );
};

Transaction.prototype.ownKeys = function() {
  const changes = Object.keys(this.delta);
  const keys = Object.keys(this.data).concat(changes);
  return keys.filter((x, i, a) => a.indexOf(x) === i);
};

Transaction.prototype.set = function(target, key, val) {
  if (target[key] === val) delete this.delta[key];
  else this.delta[key] = val;
  this.deleteDelta.delete(key);
  return true;
};

Transaction.prototype.deleteProperty = function(target, prop) {
  if (this.deleteDelta.has(prop)) return false;
  this.deleteDelta.add(prop);
  return true;
};

Transaction.start = (data) => {
  const tr = new Transaction(data);
  return new Proxy(data, tr.proxyMethods);
};

function DatasetTransaction(ds) {
  this.dataset = ds;
  const items = ds.map(Transaction.start);
  Transaction.call(this, items);
}

common.inherits(DatasetTransaction, Transaction);

DatasetTransaction.prototype.commit = function() {
  const itemProxies = this.data;
  for (const item of itemProxies) {
    if (item.commit) item.commit();
  }
  this.data = this.dataset;
  Transaction.prototype.commit.call(this);
};

DatasetTransaction.prototype.rollback = function() {
  for (const item of this.data) {
    if (item.rollback) item.rollback();
  }
  Transaction.prototype.rollback.call(this);
};

DatasetTransaction.prototype.clone = function() {
  const cloned = new DatasetTransaction(this.dataset);
  cloned.data = this.data.map(x => x.clone());
  Object.assign(cloned.delta, this.delta);
  cloned.deleteDelta = new Set(this.deleteDelta);
  return new Proxy(cloned.data, cloned.proxyMethods);
};

DatasetTransaction.start = function(ds) {
  const tr = new DatasetTransaction(ds);
  return new Proxy(tr.data, tr.proxyMethods);
};

function CursorTransaction(cursor) {
  this.cursor = cursor;
  this.items = [cursor.jsql, cursor.dataset];
  this.proxies = [
    Transaction.start(cursor.jsql),
    DatasetTransaction.start(cursor.dataset),
  ];
  [cursor.jsql, cursor.dataset] = this.proxies;
  Transaction.call(this, cursor);
}

common.inherits(CursorTransaction, Transaction);

CursorTransaction.start = (cursor) => {
  const tr = new CursorTransaction(cursor);
  return new Proxy(cursor, tr.proxyMethods);
};

CursorTransaction.prototype.commit = function() {
  for (const proxy of this.proxies) {
    proxy.commit();
  }
  [this.data.jsql, this.data.dataset] = this.items;
  Transaction.prototype.commit.call(this);
};

CursorTransaction.prototype.rollback = function() {
  for (const proxy of this.proxies) {
    proxy.rollback();
  }
  Transaction.prototype.rollback.call(this);
};

CursorTransaction.prototype.clone = function() {
  const cloned = new CursorTransaction(this.cursor);
  cloned.proxies = this.proxies.map(x => x.clone());
  Object.assign(cloned.delta, this.delta);
  cloned.deleteDelta = new Set(this.deleteDelta);
  return new Proxy(cloned.data, cloned.proxyMethods);
};

module.exports = { Transaction, DatasetTransaction, CursorTransaction };
