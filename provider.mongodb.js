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
      provider.storage = provider.connection.collection('gs.storage');
      provider.metadata = provider.connection.collection('gs.metadata');
      provider.metadata.findOne({ _id: 0 }, function(err, data) {
        if (data) {
          //console.dir({x:data});
          provider.gs.infrastructure.assign(data.tree);
          provider.gs.nextId = data.nextId;
        } else {
          var tree = {};
          provider.metadata.insertOne({ _id: 0, nextId: 0, tree: tree }, callback);
        }
      });
    }
  });
};

MongodbProvider.prototype.close = function(callback) {
  callback();
};

MongodbProvider.prototype.get = function(objectId, callback) {
  this.storage.findOne({ _id: objectId }, function(err, data) {
    if (data) {
      data.id = data._id;
      delete data._id;
    }
    callback(err, data);
  });
};

MongodbProvider.prototype.create = function(object, callback) {
  object._id = object._id || this.gs.generateId();
  this.storage.insertOne(object, callback);
};

MongodbProvider.prototype.update = function(object, callback) {
  this.storage.updateOne(
    { _id: object.objectId }, object,
    { upsert: true, w: 1 }
  ).then(callback);
};

MongodbProvider.prototype.delete = function(objectId, callback) {
  this.storage.deleteOne({ _id: objectId }, callback);
};

MongodbProvider.prototype.find = function(query, callback) {
  this.storage.find(query).toArray(callback);
};
