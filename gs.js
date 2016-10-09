'use strict';

// Global Storage API

var gs = {};
module.exports = gs;

// Objects cache keyed by objectId
//
gs.cache = {};

// Storage hosts infrastructure keyed by serverId
//
gs.infrastructure = {};

// Active connections array
//
gs.connections = [];

// Connect to Global Storage server
//   url - gs://user:password@host:port/database
//   callback - on connect function(err, connection)
//
gs.connect = function(url, callback) {
};

// Connection
//
gs.Connection = function() {
};

// Close connection
//   callback - on close connection
//
gs.Connection.close = function(callback) {

};

// Categories cache keyed by category name
//
gs.categories = {};

// Get Category
//   categoryName - name of category
//   callback - function(err, category)
//
gs.Category = function(categoryName, callback) {

};

// Get object from Global Storage
//   objectId - globally unique object id
//   callback - function(err, object)
//
gs.get = function(objectId, callback) {

};

// Create object in Global Storage
//   object - object to be stored
//   callback - function(err, objectId)
//
gs.new = function(object, callback) {

};

// Update object in Global Storage
//   object - object to be updated
//   object.id - globally unique object id
//   callback - function(err)
//
gs.update = function(object, callback) {

};

// Delete object in Global Storage
//   objectId - globally unique object id
//   callback - function(err)
//
gs.delete = function(objectId, callback) {

};

// Find objects in Global Storage
//   query - JSQL lambda expression
//   projection - to be applied after query (optional)
//   callback - function(err, data)
//
gs.find = function(query, projection, callback) {

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
