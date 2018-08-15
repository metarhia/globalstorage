'use strict';

class WebStorageMock {
  constructor() {
    const storagePropDesc = Object.create(null);
    storagePropDesc.writable = true;
    storagePropDesc.value = Object.create(null);
    Object.defineProperty(this, '_storage', storagePropDesc);
    const lengthPropDesc = Object.create(null);
    lengthPropDesc.get = () => Object.keys(this._storage).length;
    Object.defineProperty(this, 'length', lengthPropDesc);
  }

  clear() {
    this._storage = Object.create(null);
  }

  getItem(key) {
    return this._storage[key] || null;
  }

  key(index) {
    return Object.keys(this._storage)[index];
  }

  removeItem(key) {
    delete this._storage[key];
  }

  setItem(keyName, keyValue) {
    this._storage[keyName] = '' + keyValue;
  }
}

module.exports = WebStorageMock;
