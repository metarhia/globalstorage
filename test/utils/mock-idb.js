'use strict';

const installMockIdb = () => {
  const databases = new Map();
  const prevIndexedDB = Object.getOwnPropertyDescriptor(
    globalThis,
    'indexedDB',
  );

  class MockIDBRequest extends EventTarget {
    result = undefined;
    error = null;
    onsuccess = null;
    onerror = null;

    _resolve(value) {
      this.result = value;
      this.dispatchEvent(new Event('success'));
      if (this.onsuccess) this.onsuccess({ target: this });
    }

    _reject(err) {
      this.error = err;
      this.dispatchEvent(new Event('error'));
      if (this.onerror) this.onerror({ target: this });
    }
  }

  class MockIDBIndex {
    #data;
    #keyPath;

    constructor(data, keyPath) {
      this.#data = data;
      this.#keyPath = keyPath;
    }

    #match(record, searchKey) {
      if (Array.isArray(this.#keyPath)) {
        for (let i = 0; i < this.#keyPath.length; i++) {
          if (record[this.#keyPath[i]] !== searchKey[i]) return false;
        }
        return true;
      }
      return record[this.#keyPath] === searchKey;
    }

    #find(searchKey) {
      for (const [pk, record] of this.#data) {
        if (this.#match(record, searchKey)) return { pk, record };
      }
      return null;
    }

    get(searchKey) {
      const req = new MockIDBRequest();
      const found = this.#find(searchKey);
      queueMicrotask(() => req._resolve(found ? found.record : undefined));
      return req;
    }

    getKey(searchKey) {
      const req = new MockIDBRequest();
      const found = this.#find(searchKey);
      queueMicrotask(() => req._resolve(found ? found.pk : undefined));
      return req;
    }
  }

  class MockIDBObjectStore {
    #data;
    #keyPath;
    #indexes;

    constructor(data, keyPath, indexes) {
      this.#data = data;
      this.#keyPath = keyPath;
      this.#indexes = indexes;
    }

    get(key) {
      const req = new MockIDBRequest();
      const value = this.#data.get(key);
      queueMicrotask(() => req._resolve(value));
      return req;
    }

    add(record) {
      const req = new MockIDBRequest();
      const key = record[this.#keyPath];
      this.#data.set(key, record);
      queueMicrotask(() => req._resolve(key));
      return req;
    }

    put(record) {
      const req = new MockIDBRequest();
      const key = record[this.#keyPath];
      this.#data.set(key, record);
      queueMicrotask(() => req._resolve(key));
      return req;
    }

    delete(key) {
      const req = new MockIDBRequest();
      this.#data.delete(key);
      queueMicrotask(() => req._resolve(undefined));
      return req;
    }

    createIndex(name, keyPath) {
      this.#indexes.set(name, { keyPath });
    }

    index(name) {
      const idx = this.#indexes.get(name);
      if (!idx) throw new DOMException(`No index: ${name}`, 'NotFoundError');
      return new MockIDBIndex(this.#data, idx.keyPath);
    }
  }

  class MockIDBTransaction {
    #stores;

    constructor(stores) {
      this.#stores = stores;
    }

    objectStore(name) {
      const store = this.#stores.get(name);
      if (!store) {
        throw new DOMException(`No store: ${name}`, 'NotFoundError');
      }
      return new MockIDBObjectStore(store.data, store.keyPath, store.indexes);
    }
  }

  class MockIDBDatabase {
    #dbRecord;

    constructor(dbRecord) {
      this.#dbRecord = dbRecord;
    }

    get objectStoreNames() {
      const names = [...this.#dbRecord.stores.keys()];
      return { contains: (n) => names.includes(n) };
    }

    createObjectStore(name, options = {}) {
      const storeRecord = {
        keyPath: options.keyPath || null,
        data: new Map(),
        indexes: new Map(),
      };
      this.#dbRecord.stores.set(name, storeRecord);
      return new MockIDBObjectStore(
        storeRecord.data,
        storeRecord.keyPath,
        storeRecord.indexes,
      );
    }

    transaction(storeNames) {
      const stores = new Map();
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      for (const name of names) {
        stores.set(name, this.#dbRecord.stores.get(name));
      }
      return new MockIDBTransaction(stores);
    }
  }

  const mockIndexedDB = {
    open(name, version) {
      const req = new MockIDBRequest();
      queueMicrotask(() => {
        let dbRecord = databases.get(name);
        const isNew = !dbRecord;
        const needsUpgrade = isNew || dbRecord.version < version;
        if (isNew) {
          dbRecord = { version, stores: new Map() };
          databases.set(name, dbRecord);
        }
        const db = new MockIDBDatabase(dbRecord);
        if (needsUpgrade) {
          req.result = db;
          dbRecord.version = version;
          if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
        }
        req._resolve(db);
      });
      return req;
    },
  };

  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    writable: true,
    enumerable: true,
    value: mockIndexedDB,
  });

  const reset = () => {
    databases.clear();
  };

  const uninstall = () => {
    if (prevIndexedDB) {
      Object.defineProperty(globalThis, 'indexedDB', prevIndexedDB);
    } else {
      delete globalThis.indexedDB;
    }
  };

  return { reset, uninstall };
};

module.exports = { installMockIdb };
