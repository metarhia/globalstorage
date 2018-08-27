'use strict';
/* eslint-env browser */

const common = require('metarhia-common');
const metasync = require('metasync');
const { StorageProvider } = require('./provider');
const { PostponedCursor } = require('./postponed.cursor');

class IndexedDBProvider extends StorageProvider {
  constructor() {
    super();
    this.stat = null;
  }

  open(options, callback) {
    callback = common.once(callback);

    super.open(options, () => {
      if (!this.db) {
        return;
      }

      const tx = this.db.transaction(['gsMetadata'], 'readwrite');
      tx.onerror = () => callback(tx.error);
      tx.oncomplete = () => callback(null);

      const metadata = tx.objectStore('gsMetadata');
      const request = metadata.get(0);
      request.onsuccess = event => {
        if (event.result) {
          this.stat = event.result;
        } else {
          const initialMetadata = { id: 0, next: 1, tree: {} };
          metadata.add(initialMetadata);
        }
      };
    });
  }

  close(callback) {
    if (this.db) {
      callback();
      return;
    }
    this.db.onclose = callback;
    this.db.close();
  }

  category(name) {
    return this.db.transaction([name]).objectStore(name);
  }

  generateId(store, callback) {
    if (typeof store === 'function') {
      callback = common.once(store);
      const tx = this.db.transaction('gsMetadata', 'readwrite');
      tx.onerror = () => callback(tx.error);
      store = tx.objectStore(this.options.storeName);
    }
    this._generateId(store, callback);
  }

  _generateId(store, callback) {
    callback = common.once(callback);
    const request = store.get(0);
    request.onsuccess = event => {
      const metadata = event.target.result;
      const id = metadata.next++;
      const request = store.put(metadata);
      request.onsuccess = () => {
        callback(null, id);
      };
    };
  }

  get(id, callback) {
    callback = common.once(callback);
    const tx = this.db.transaction('gsStorage');
    tx.onerror = () => callback(tx.error);

    tx.objectStore('gsStorage').get(id).onsuccess = (event) => {
      const { category } = event.target.result;
      const tx = this.db.transaction(category);
      tx.onerror = () => callback(tx.error);

      tx.objectStore(category).get(id).onsuccess = (event) =>
        callback(null, event.target.result);
    };
  }

  create(obj, callback) {
    callback = common.once(callback);
    const tx = this.db.transaction(
      ['gsStorage', 'gsMetadata', obj.category],
      'readwrite'
    );
    tx.onerror = () => callback(tx.error);

    this._generateId(tx.objectStore('gsMetadata'), (error, id) => {
      if (error) {
        return;
      }
      obj.id = id;
      tx
        .objectStore('gsStorage')
        .add({ id, category: obj.category }).onsuccess = () => {
          tx.objectStore(obj.category).add(obj).onsuccess = () => {
            callback(null, id);
          };
        };
    });
  }

  update(obj, callback) {
    callback = common.once(callback);
    let tx = this.db.transaction(['gsStorage', obj.category], 'readwrite');
    tx.onerror = () => callback(tx.error);

    tx.objectStore('gsStorage').get(obj.id).onsuccess = event => {
      if (obj.category !== event.target.result.category) {
        obj.category = event.target.result.category;
        tx = this.db.transaction(obj.category, 'readwrite');
        tx.onerror = () => callback(tx.error);
      }
      tx.objectStore(obj.category).put(obj).onsuccess = () => {
        callback(null);
      };
    };
  }

  delete(id, callback) {
    const tx = this.db.transaction(['gsStorage'], 'readwrite');
    tx.onerror = () => callback(tx.error);

    tx.objectStore('gsStorage').get({ id }).onsuccess = event => {
      const category = event.target.result.category;
      const tx = this.db.transaction(category, 'readwrite');
      tx.onerror = () => callback(tx.error);
      tx.objectStore(category).delete(id).onsuccess = () => {
        callback(null);
      };
    };
  }
}

module.exports = { IndexedDBProvider };
