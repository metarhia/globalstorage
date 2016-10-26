'use strict';

// Global Storage API

var tree = require('./src/api.tree');

var gs = {};
module.exports = gs;

// Objects cache keyed by objectId
//
gs.cache = {};

// Storage hosts infrastructure keyed by serverId
//
gs.infrastructure = {
  0:  new Server('s0'),
  1:  new Server('s1'),
  2:  new Server('s2'),
  3:  new Server('s3'),
  6:  new Server('s6'),
  10: new Server('s10'),
};

function Server(name) {
  this.name = name;
}

Server.prototype.toString = function() { return this.name; };

// Only for development
Server.prototype.get = Server.prototype.new =
  Server.prototype.update = Server.prototype.delete =
    function() { console.log(this.name); };

// Tree builded from storage hosts infrastructure
//
gs.infrastructureTree = makeInfrastructureTree(gs.infrastructure);

// Active connections array
//
gs.connections = [];

// Connect to Global Storage server
//   url - gs://user:password@host:port/database
//   callback - on connect function(err, connection)
//
gs.connect = function(url, callback) {
  var connectionInfo = parseURL(url);
  checkConnectionInfo(connectionInfo, function(err, isInfoOk) {
    if (err) callback(err);

    if (isInfoOk) {
      var newConnection = new gs.Connection(connectionInfo);
      gs.connections.push(newConnection);
      callback(null, newConnection);
    } else {
      callback(new Error('Wrong connection info'));
    }
  });
};

// Connection
//
gs.Connection = function(connectionInfo) {
  this.databaseName = connectionInfo.database;
};

// Close connection
//   callback - on close connection
//
gs.Connection.prototype.close = function(callback) {
  gs.connections.splice(gs.connections.indexOf(this), 1);
  callback(null);
};

// Categories cache keyed by category name
//
gs.categories = {};

// Get Category
//   categoryName - name of category
//   callback - function(err, category)
//
gs.Category = function(categoryName, callback) {
  if (!(categoryName in gs.categories)) {
    gs.categories[categoryName] = { };
  }
  callback(null, gs.categories[categoryName]);
};

// Get object from Global Storage
//   objectId - globally unique object id
//   callback - function(err, object)
//
gs.get = function(objectId, callback) {
  if (objectId in gs.cache) {
    var resObject = gs.cache[objectId];
    callback(null, resObject);
  } else {
    var serverWithId = gs.infrastructureTree.get(objectId),
        server = serverWithId.val;
    server.get(objectId, callback);
  }
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
  var serverId = gs.infrastructureTree(object.id);
  gs.infrastructure[serverId].update(object, callback);
};

// Delete object in Global Storage
//   objectId - globally unique object id
//   callback - function(err)
//
gs.delete = function(objectId, callback) {
  var serverId = gs.infrastructureTree(objectId);
  gs.infrastructure[serverId].delete(objectId, callback);
};

// Find objects in Global Storage
//   query - JSQL lambda expression
//   projection - to be applied after query (optional)
//   callback - function(err, data)
//
// TODO: write more effective implementation of sharding
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

function parseURL(url) {
  var separatorsRegExp = /:\/\/|:|@|\//,
      fieldNames = ['gs', 'user', 'password', 'host', 'port', 'database'];

  var infoArray = url.split(separatorsRegExp),
      infoObject = {};
  for (var i = 0; i < fieldNames.length; i++) {
    infoObject[fieldNames[i]] = infoArray[i];
  }
  return infoObject;
}

function checkConnectionInfo(connectionInfo, callback) {
  callback(null, true);
}

function makeInfrastructureTree(infrastructure) {
  var res = tree.empty(),
      serverIds = Object.keys(infrastructure);
  for (var i = 0; i < serverIds.length; i++) {
    var serverId = serverIds[i];
    res.insert(serverId, infrastructure[serverId]);
  }
  return res;
}

// Testing
//
// var tr = tree.empty();
// tr.insert(0, '123');
// tr.insert(1, '456');
// console.log(tr.toString());
// console.log(gs.infrastructureTree.toString());
// Object.keys(gs.infrastructure).forEach(function(key) {
//   console.log('Key');
//   console.log(key);
//   console.log('Server');
//   gs.get(key);
// });
