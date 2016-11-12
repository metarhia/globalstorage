'use strict';

module.exports = MongodbProvider;
var util = require('util');
var StorageProvider = require('./provider.js');
util.inherits(MongodbProvider, StorageProvider);

// MongoDB Storage Provider
//
function MongodbProvider() {
}

MongodbProvider.prototype.open = function(options, callback) {
  var provider = this;
  StorageProvider.prototype.open.call(provider, options, function() {
    if (provider.connection) {
      provider.storage = provider.connection.collection('gsStorage');
      provider.metadata = provider.connection.collection('gsMetadata');
      provider.metadata.findOne({ _id: 0 }, function(err, data) {
        if (data) {
          provider.gs.infrastructure.assign(data.tree);
          provider.gs.nextId = data.nextId;
          provider.gs.categories = data.categories;
        } else {
          var metadata = {
            _id: 0,
            nextId: 0,
            tree: {}
          };
          provider.metadata.insertOne(metadata, callback);
        }
      });
    }
  });
};

MongodbProvider.prototype.close = function(callback) {
  callback();
};

MongodbProvider.prototype.category = function(name) {
  return this.connection.collection('c' + name);
};

MongodbProvider.prototype.generateId = function(callback) {
  var provider = this;
  this.metadata.findAndModify(
    { _id: 0 }, null,
    { $inc: { nextId: 1 } },
    { upsert: true, new: true },
    function(err, res) {
      if (err) {
        if (err.code === 11000) {
          process.nextTick(function() {
            provider.generateId(callback);
          });
        } else callback(err);
      } else callback(null, res.value.nextId);
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
    if (err) callback(err);
    else {
      obj._id = id;
      obj.id = id;
      var index = {
        _id: id,
        category: obj.category
      };
      provider.storage.insertOne(index, function(err) {
        if (err) callback(err);
        else {
          var category = provider.category(obj.category);
          category.insertOne(obj, function(err, data) {
            if (err) callback(err);
            else callback(null, true);
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
    if (err) callback(err);
    else if (data) {
      var category = provider.category(data.category);
      category.updateOne(
        { _id: obj._id }, obj, { upsert: true, w: 1 }, callback
      );
    } else callback(new Error('Record not found'));
  });
};

MongodbProvider.prototype.delete = function(query, callback) {
  var provider = this;
  if (typeof(query) === 'object') {
    provider.find(query, function(err, data) {
      if (err) callback(err);
      else {
        for (var i = 0; i < data.length; i++) {
          deleteOne(data[i]);
        }
        callback();
      }
    });
  } else if (typeof(query) === 'number') {
    provider.metadata.findOne({ _id: query }, function(err, data) {
      if (err) callback(err);
      else if (data) {
        deleteOne(data);
        callback();
      } else callback(new Error('Record not found'));
    });
  } else callback(new Error('Nothing to delete'));

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

MongodbProvider.prototype.find = function(query, options, callback) {
  var provider = this;
  var category = provider.category(query.category);
  if (!callback) {
    callback = options;
    options = {};
  }
  var cursor = category.find(query);
  if (options.sort) {
    var order = {};
    order[options.sort] = 1;
    cursor = cursor.sort(order);
  }
  if (options.limit) {
    cursor = cursor.limit(options.limit);
  }
  cursor.toArray(function(err, data) {
    if (err) callback(err);
    else {
      data.forEach(function(obj) {
        obj.id = obj._id;
      });
      callback(null, data);
    }
  });
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
    background: def.background !== undefined ? def.background : true
  };
  category.createIndex(keys, options, callback);
};
