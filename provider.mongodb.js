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
            tree: {},
            categories: []
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

MongodbProvider.prototype.get = function(objectId, callback) {
  var provider = this;
  provider.storage.findOne({ _id: objectId }, function(err, data) {
    if (data) {
      var categoryName = data.category;
      var category = provider.connection.collection(categoryName);
      category.findOne({ _id: objectId }, function(err, data) {
        if (data) {
          data.id = data._id;
          delete data._id;
        }
        callback(err, data);
      });
    }
    callback(err, data);
  });
};

MongodbProvider.prototype.create = function(object, callback) {
  var provider = this;
  var id = object.id || provider.gs.generateId();
  object._id = object.id;
  var index = {
    _id: object.id,
    category: object.category
  };
  delete object.id;
  provider.storage.insertOne(index, function(err) {
    if (!err) {
      var categoryName = object.category;
      var category = provider.connection.collection(categoryName);
      category.insertOne(object, callback);
    } else callback(err);
  });
};

MongodbProvider.prototype.update = function(object, callback) {
  var provider = this;
  var id = object.id;
  delete object.id;
  object._id = id;
  provider.storage.findOne({ _id: id }, function(err, data) {
    if (!err) {
      var categoryName = data.category;
      var category = provider.connection.collection(categoryName);
      category.updateOne(
        { _id: id }, object, { upsert: true, w: 1 }
      ).then(callback);
    } else callback(err);
  });
};

MongodbProvider.prototype.delete = function(objectId, callback) {
  var provider = this;
  var categoryName = data.category;
  var category = provider.connection.collection(categoryName);
  category.deleteOne({ _id: objectId }, function(err) {
    if (!err) {
      provider.storage.deleteOne({ _id: objectId }, callback);
    } else callback(err);
  });
};

MongodbProvider.prototype.find = function(query, callback) {
  var provider = this;
  var categoryName = query.category;
  var category = provider.connection.collection(categoryName);
  category.find(query).toArray(function(err, data) {
    if (!err) {
      // TODO: rename _id to id
      callback(null, data);
    } else callback(err);
  });
};
