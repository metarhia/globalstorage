'use strict';

const util = require('util');

module.exports = MongodbProvider;
const StorageProvider = require('./provider.js');
util.inherits(MongodbProvider, StorageProvider);

const MongodbCursor = require('./cursor.mongodb.js');

// MongoDB Storage Provider
//
function MongodbProvider() {
  this.stat = null;
}

MongodbProvider.prototype.open = function(options, callback) {
  let provider = this;
  StorageProvider.prototype.open.call(provider, options, () => {
    if (provider.connection) {
      provider.storage = provider.connection.collection('gsStorage');
      provider.metadata = provider.connection.collection('gsMetadata');
      provider.metadata.findOne({ _id: 0 }, (err, data) => {
        if (data) {
          delete data._id;
          //provider.gs.infrastructure.assign(data.tree);
          provider.stat = data;
          if (callback) callback();
        } else {
          let metadata = {
            _id: 0,
            next: 0,
            tree: {}
          };
          provider.metadata.insertOne(metadata, callback);
        }
      });
    }
  });
};

MongodbProvider.prototype.close = function(callback) {
  if (callback) callback();
};

MongodbProvider.prototype.category = function(name) {
  if (!name) {
    throw new Error('Category is not specified');
  }
  return this.connection.collection('c' + name);
};

MongodbProvider.prototype.generateId = function(callback) {
  let provider = this;
  this.metadata.findAndModify(
    { _id: 0 }, null,
    { $inc: { next: 1 } },
    { upsert: true, new: true },
    (err, res) => {
      if (err) {
        if (err.code === 11000) {
          process.nextTick(() => provider.generateId(callback));
        } else callback(err);
      } else callback(null, res.value.next);
    }
  );
};

MongodbProvider.prototype.get = function(id, callback) {
  let provider = this;
  provider.storage.findOne({ _id: id }, (err, data) => {
    if (data) {
      let category = provider.category(data.category);
      category.findOne({ _id: id }, (err, data) => {
        if (data) data.id = data._id;
        callback(err, data);
      });
    }
    callback(err, data);
  });
};

MongodbProvider.prototype.create = function(obj, callback) {
  let provider = this;
  provider.generateId((err, id) => {
    if (err) {
      if (callback) callback(err);
    } else {
      obj._id = id;
      obj.id = id;
      let index = {
        _id: id,
        category: obj.category
      };
      provider.storage.insertOne(index, (err) => {
        if (err) {
          if (callback) callback(err);
        } else {
          let category = provider.category(obj.category);
          category.insertOne(obj, (err, data) => {
            if (callback) {
              if (err) callback(err);
              else callback(null, true);
            }
          });
        }
      });
    }
  });
};

MongodbProvider.prototype.update = function(obj, callback) {
  let provider = this;
  obj._id = obj.id;
  provider.storage.findOne({ _id: obj._id }, (err, data) => {
    if (err) {
      if (callback) callback(err);
    } else if (data) {
      let category = provider.category(data.category);
      category.updateOne(
        { _id: obj._id }, obj, { upsert: true, w: 1 }, callback
      );
    } else if (callback) {
      callback(new Error('Record not found'));
    }
  });
};

MongodbProvider.prototype.delete = function(query, callback) {
  let provider = this;
  if (typeof(query) === 'object') {
    provider.select(query, (err, data) => {
      if (err) {
        if (callback) callback(err);
      } else {
        for (let i = 0; i < data.length; i++) {
          deleteOne(data[i]);
        }
        if (callback) callback();
      }
    });
  } else if (typeof(query) === 'number') {
    provider.metadata.findOne({ _id: query }, (err, data) => {
      if (err) {
        if (callback) callback(err);
      } else if (data) {
        deleteOne(data);
        if (callback) callback();
      } else if (callback) {
        callback(new Error('Record not found'));
      }
    });
  } else if (callback) {
    callback(new Error('Nothing to delete'));
  }

  function deleteOne(record) {
    if (record.category) {
      let category = provider.category(record.category);
      category.deleteOne({ _id: record.id }, (err) => {
        if (!err) {
          provider.storage.deleteOne({ _id: record.id });
        }
      });
    }
  }
};

MongodbProvider.prototype.select = function(query, options, callback) {
  let provider = this;
  let category = provider.category(query.category);
  if (!callback) {
    callback = options;
    options = {};
  }
  let cursor = category.find(query);
  /*
  if (options.sort) {
    let order = {};
    order[options.sort] = 1;
    cursor = cursor.sort(order);
  }
  if (options.limit) {
    cursor = cursor.limit(options.limit);
  }
  */
  if (callback) {
    cursor.toArray((err, data) => {
      if (err) callback(err);
      else {
        data.forEach(obj => obj.id = obj._id);
        callback(null, data);
      }
    });
  } else {
    let mс = new MongodbCursor(this, cursor);
    mс.jsql.push({ op: 'select', query: query, options: options });
    return mс;
  }
};

MongodbProvider.prototype.index = function(def, callback) {
  let provider = this;
  let category = provider.category(def.category);
  let keys = {};
  def.fields.forEach(key => keys[key] = 1);
  let options = {
    unique: def.unique !== undefined ? def.unique : false,
    sparse: def.nullable !== undefined ? def.nullable : false,
    background: def.background !== undefined ? def.background : true
  };
  category.createIndex(keys, options, callback);
};
