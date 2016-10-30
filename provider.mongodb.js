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
    this.connection = this.connection.collection('storage');
  }
  callback();
};

MongodbProvider.prototype.close = function(callback) {
  callback();
};

MongodbProvider.prototype.get = function(objectId, callback) {
  this.connection.findOne({ objectId: object.objectId }, callback);
};

MongodbProvider.prototype.create = function(object, callback) {
  this.connection.insertOne(object, callback);
};

MongodbProvider.prototype.update = function(object, callback) {
  this.connection.updateOne(
    { objectId: object.objectId },
    object,
    { upsert: true, w: 1 }
  ).then(callback);
};

MongodbProvider.prototype.delete = function(objectId, callback) {
  this.connection.deleteOne({ objectId: objectId }, callback);
};

MongodbProvider.prototype.find = function(query, callback) {
  this.connection.find(query).toArray(callback);
};
