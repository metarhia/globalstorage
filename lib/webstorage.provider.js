'use strict';

const { StorageProvider } = require('./provider');
const { MemoryCursor } = require('./memory.cursor');

const mdsf = require('mdsf');

class WebStorageProvider extends StorageProvider {
  _setOrUpdateData(key, newValue, callback) {
    try {
      this.db.setItem(key.toString(), mdsf.stringify(newValue));
    } catch (e) {
      callback(e);
      return;
    }
    callback();
  }

  _getData(key) {
    const dataStr = this.db.getItem(key.toString());
    if (!dataStr) {
      return dataStr;
    }
    return mdsf.parse(dataStr);
  }

  open(options, callback) {
    super.open(options, () => {
      if (this.db) {
        this.metadata = 'gsMetadata';
        let metadata = this._getData(this.metadata);
        if (!metadata) {
          metadata = {
            next: 0,
          };
          this._setOrUpdateData(this.metadata, metadata, callback);
          return;
        }
      }
      callback();
    });
  }

  close(callback) {
    callback();
  }

  generateId(callback) {
    const metadata = this._getData(this.metadata);
    const id = metadata.next++;
    this._setOrUpdateData(this.metadata, metadata, err => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, id);
    });
  }

  get(id, callback) {
    id = id.toString();
    for (let i = 0; i < this.db.length; i++) {
      const key = this.db.key(i);
      if (key === id) {
        callback(null, this._getData(key));
        return;
      }
    }
    callback(null, null);
  }

  create(obj, callback) {
    this.generateId((err, id) => {
      if (err) {
        callback(err);
        return;
      }

      obj.id = id;
      this._setOrUpdateData(id, obj, err => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, id);
      });
    });
  }

  update(obj, callback) {
    const existingData = this._getData(obj.id);
    if (!obj.id || !existingData) {
      callback(new Error('Nothing to update'));
      return;
    }
    this._setOrUpdateData(obj.id, obj, callback);
  }

  delete(id, callback) {
    const existingData = this._getData(id);
    if (!existingData) {
      callback(new Error('Nothing to delete'));
      return;
    }
    this.db.removeItem(id.toString());
    callback();
  }

  select(query, options) {
    const result = new Array(this.db.length);
    let len = 0;
    for (let i = 0; i < this.db.length; i++) {
      const key = this.db.key(i);
      const data = this._getData(key);
      if (query.category === data.category) {
        result[len++] = data;
      }
    }
    result.length = len;
    const mc = new MemoryCursor(result);
    mc.provider = this;
    mc.jsql.push({ op: 'select', query, options });
    return mc;
  }
}

module.exports = { WebStorageProvider };
