'use strict';

// Global Storage API

var util = require('util');
var StorageProvider = require('./provider.js');
var MongodbProvider = require('./provider.mongodb.js');
var Connection = require('./connection.js');
var Category = require('./category.js');
var NO_STORAGE = 'No storage provider available';

var gs = new StorageProvider();
module.exports = gs;

gs.StorageProvider = StorageProvider;
gs.MongodbProvider = MongodbProvider;
gs.Connection = Connection;
gs.Category = Category;

// Objects cache keyed by objectId
//
gs.cache = {};

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
  connection
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
    gs.localStorageProvider.get(objectId, callback);
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
    gs.localStorageProvider.get(object, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.delete = function(objectId, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.get(objectId, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.find = function(query, callback) {
  if (gs.localStorageProvider) {
    gs.localStorageProvider.get(query, callback);
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
