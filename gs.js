'use strict';

// Global Storage API

var util = require('util');
var StorageProvider = require('./provider.js');
var MongodbProvider = require('./provider.mongodb.js');
var FsProvider = require('./provider.fs.js');
var MemoryProvider = require('./provider.memory.js');
var Connection = require('./connection.js');
var Category = require('./category.js');
var NO_STORAGE = 'No storage provider available';

var gs = new StorageProvider();
module.exports = gs;

gs.StorageProvider = StorageProvider;
gs.MongodbProvider = MongodbProvider;
gs.FsProvider = FsProvider;
gs.MemoryProvider = MemoryProvider;
gs.Connection = Connection;
gs.Category = Category;

// Hash keyed by provider name
//
gs.providers = {
  mongodb: MongodbProvider,
  fs: FsProvider,
  memory: MemoryProvider
};

// Objects cache keyed by objectId
//
gs.cache = {}; // TODO: MemoryStorageProvider

// Database mode
//   closed - no one provider is available
//   offline - local storage provider is available
//   online - local and connections are available
//
gs.mode = 'closed';

// Local storage provider
// implementing interface globalStorageProvider
//
gs.localStorageProvider = null;

gs.open = function(callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.open(callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

// Remote storage provider
// implementing interface globalStorageProvider
//
gs.connections = {};

// Connect to Global Storage server
//   options - connection parammeters
//     url - gs://user:password@host:port/database
//   callback - on connect function(err, connection)
//
gs.connect = function(options, callback) {
  var connection = new Connection(options);
  callback(null, connection);
};

// Categories cache keyed by category name
//
gs.categories = {};

// Get Category
//   categoryName - name of category
//   callback - function(err, category)
//
gs.category = function(name, callback) {
  var cat = gs.categories[name];
  if (!cat) {
    cat = new Category(name);
    gs.categories[name] = cat;
  }
  callback(null, cat);
};

// Override StorageProvider methods

gs.get = function(objectId, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.findOne(objectId, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.create = function(object, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.create(object, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.update = function(object, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.update(
      { objectId: object.objectId }, object, callback
    );
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.delete = function(objectId, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.remove(objectId, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.find = function(query, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.find(query, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

/* Some conceptual examples

cities.get({ name: 'Kiev' }, { city: ['name', upper] }, function(err, kiev) {
  var cities = api.gs.category('City');
  var form1 = api.guiConsole.createScreen(cities);
  form1.on('focus', callback);
  form1.on('save', function() {
    cities.update(form1.toObject());
  });
  form1.show();
});

*/

// Convert data array into object using category metadata
//   data - array to be mapped to given metadata by key position
//   category - metadata definition
//   return - JavaScript object
//
gs.dataToObject = function(data, category) {

};

// Convert object into data array using category metadata
//   object - JavaScript object to be mapped to array by key position
//   category - metadata definition
//   return - data array
//
gs.objectToData = function(object, category) {

};

// Create data crojection
//   data - data array of objects or category
//   metadata - projection language
//   return - fake object with get/set
//
gs.projection = function(data, metadata) {

};

// Global Storage Infrastructure
//
gs.infrastructure = {};

// Servers tree
//
gs.infrastructure.tree = {};

// Servers index
//
gs.infrastructure.index = [];

// Server bit mask
//
gs.infrastructure.mask = 0,

// Assign new tnfrastructure tree
//
gs.infrastructure.assign = function(tree) {
  gs.infrastructure.servers = tree;
  var index = [tree.S0];
  gs.infrastructure.index = index;
  gs.infrastructure.bits = Math.log(index.length) / Math.log(2);
  gs.infrastructure.mask = Math.pow(2, gs.infrastructure.bits) - 1;
};

// Get server for objectId
//
gs.findServer = function(objectId) {
  return (
    gs.infrastructure.index[objectId & gs.infrastructure.mask]
  );
};

// Last objectId in storage
//
gs.nextId = 0;

// Get server for objectId
//
gs.generateId = function() {
  return gs.nextId++;
};
