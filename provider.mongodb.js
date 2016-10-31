'use strict';

module.exports = MongodbProvider;
var util = require('util');
var StorageProvider = require('./provider.js');
util.inherits(MongodbProvider, StorageProvider);

// Abstract Storage Provider
//
function MongodbProvider(options) {
  StorageProvider.call(this, options);
};

MongodbProvider.prototype.open = function(callback) {
  if (this.connection) {
    this.storage = this.connection.connection.collection('storage');
  }
  callback();
};

MongodbProvider.prototype.close = function(callback) {
  callback();
};

MongodbProvider.prototype.get = function(objectId, callback) {
  this.storage.findOne({ objectId: objectId }, callback);
};

MongodbProvider.prototype.create = function(object, callback) {
  this.storage.insertOne(object, callback);
};

MongodbProvider.prototype.update = function(object, callback) {
  this.storage.updateOne(
    { objectId: object.objectId },
    object,
    { upsert: true, w: 1 }
  ).then(callback);
};

MongodbProvider.prototype.delete = function(objectId, callback) {
  this.storage.deleteOne({ objectId: objectId }, callback);
};

MongodbProvider.prototype.find = function(query, callback) {
  this.storage.find(query).toArray(callback);
};
