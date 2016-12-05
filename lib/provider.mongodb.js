'use strict';

var util = require('util');

module.exports = MongodbProvider;
var StorageProvider = require('./provider.js');
util.inherits(MongodbProvider, StorageProvider);

var MongodbCursor = require('./cursor.mongodb.js');

// MongoDB Storage Provider
//
function MongodbProvider() {
  this.stat = null;
}

MongodbProvider.prototype.open = function(options, callback) {
  var provider = this;
  StorageProvider.prototype.open.call(provider, options, function() {
    if (provider.connection) {
      provider.storage = provider.connection.collection('gsStorage');
      provider.metadata = provider.connection.collection('gsMetadata');
      provider.metadata.findOne({ _id: 0 }, function(err, data) {
        if (data) {
          delete data._id;
          //provider.gs.infrastructure.assign(data.tree);
          provider.stat = data;
          if (callback) callback();
        } else {
          var metadata = {
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
  var provider = this;
  this.metadata.findAndModify(
    { _id: 0 }, null,
    { $inc: { next: 1 } },
    { upsert: true, new: true },
    function(err, res) {
      if (err) {
        if (err.code === 11000) {
          process.nextTick(function() {
            provider.generateId(callback);
          });
        } else callback(err);
      } else callback(null, res.value.next);
    }
  );
};

MongodbProvider.prototype.get = function(id, callback) {
  var provider = this;
  provider.storage.findOne({ _id: id }, function(err, data) {
    if (data) {
      var category = provider.category(data.category);
      category.findOne({ _id: id }, function(err, data) {
        if (data) data.id = data._id;
        callback(err, data);
      });
    }
    callback(err, data);
  });
};

MongodbProvider.prototype.create = function(obj, callback) {
  var provider = this;
  provider.generateId(function(err, id) {
    if (err) {
      if (callback) callback(err);
    } else {
      obj._id = id;
      obj.id = id;
      var index = {
        _id: id,
        category: obj.category
      };
      provider.storage.insertOne(index, function(err) {
        if (err) {
          if (callback) callback(err);
        } else {
          var category = provider.category(obj.category);
          category.insertOne(obj, function(err, data) {
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
  var provider = this;
  obj._id = obj.id;
  provider.storage.findOne({ _id: obj._id }, function(err, data) {
    if (err) {
      if (callback) callback(err);
    } else if (data) {
      var category = provider.category(data.category);
      category.updateOne(
        { _id: obj._id }, obj, { upsert: true, w: 1 }, callback
      );
    } else {
      if (callback) callback(new Error('Record not found'));
    }
  });
};

MongodbProvider.prototype.delete = function(query, callback) {
  var provider = this;
  if (typeof(query) === 'object') {
    provider.select(query, function(err, data) {
      if (err) {
        if (callback) callback(err);
      } else {
        for (var i = 0; i < data.length; i++) {
          deleteOne(data[i]);
        }
        if (callback) callback();
      }
    });
  } else if (typeof(query) === 'number') {
    provider.metadata.findOne({ _id: query }, function(err, data) {
      if (err) {
        if (callback) callback(err);
      } else if (data) {
        deleteOne(data);
        if (callback) callback();
      } else {
        if (callback) callback(new Error('Record not found'));
      }
    });
  } else {
    if (callback) callback(new Error('Nothing to delete'));
  }

  function deleteOne(record) {
    if (record.category) {
      var category = provider.category(record.category);
      category.deleteOne({ _id: record.id }, function(err) {
        if (!err) {
          provider.storage.deleteOne({ _id: record.id });
        }
      });
    }
  }
};

MongodbProvider.prototype.select = function(query, options, callback) {
  var provider = this;
  var category = provider.category(query.category);
  if (!callback) {
    callback = options;
    options = {};
  }
  var cursor = category.find(query);
  /*
  if (options.sort) {
    var order = {};
    order[options.sort] = 1;
    cursor = cursor.sort(order);
  }
  if (options.limit) {
    cursor = cursor.limit(options.limit);
  }
  */
  if (callback) {
    cursor.toArray(function(err, data) {
      if (err) callback(err);
      else {
        data.forEach(function(obj) {
          obj.id = obj._id;
        });
        callback(null, data);
      }
    });
  } else {
    var mс = new MongodbCursor(this, cursor);
    mс.jsql.push({ op: 'select', query: query, options: options });
    return mс;
  }
};

MongodbProvider.prototype.index = function(def, callback) {
  var provider = this;
  var category = provider.category(def.category);
  var keys = {};
  def.fields.forEach(function(key) {
    keys[key] = 1;
  });
  var options = {
    unique: def.unique !== undefined ? def.unique : false,
    sparse: def.nullable !== undefined ? def.nullable : false,
    background: def.background !== undefined ? def.background : true
  };
  category.createIndex(keys, options, callback);
};
