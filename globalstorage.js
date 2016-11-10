'use strict';

// Global Storage API

var util = require('util');
var StorageProvider = require('./provider.js');

var FsProvider = require('./provider.fs.js');
var MemoryProvider = require('./provider.memory.js');
var MongodbProvider = require('./provider.mongodb.js');

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
  fs: FsProvider,
  memory: MemoryProvider,
  mongodb: MongodbProvider,
};

// Objects cache keyed by id
//
gs.memory = new MemoryProvider();

// Database mode
//   closed - no one provider is available
//   offline - local storage provider is available
//   online - local and connections are available
//
gs.mode = 'closed';

// Local storage provider
// implementing interface globalStorageProvider
//
gs.local = null;

gs.open = function(options, callback) {
  if (gs.memory) {
    gs.memory.open({
      gs: options.gs
    }, function() {
    });
  }

  var Provider = gs.providers[options.provider];
  if (Provider) {
    gs.local = new Provider();
    gs.local.open({
      gs: options.gs,
      connection: options.connection
    }, callback);
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
//
gs.get = function(id, callback) {
  if (gs.memoryStorageProvider) {
    gs.memoryStorageProvider.get(id, function(err, data) {
      if (data) callback(null, data);
      else get(id, callback);
    });
  } else get(id, callback);

  function get(id, callback) {
    if (gs.local) {
      gs.local.get(id, function(err, data) {
        if (data) callback(null, data);
        else {
          var sid = gs.findServer(id);
          var connection = gs.infrastructure.index[sid];
          connection.get(id, callback);
        }
      });
    } else {
      callback(new Error(NO_STORAGE));
    }
  }
};

gs.create = function(object, callback) {
  if (gs.local) {
    gs.local.create(object, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.update = function(object, callback) {
  if (gs.local) {
    gs.local.update(
      object, callback
    );
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.delete = function(id, callback) {
  if (gs.local) {
    gs.local.delete(id, callback);
  } else {
    callback(new Error(NO_STORAGE));
  }
};

gs.find = function(query, callback) {
  if (gs.local) {
    gs.local.find(query, callback);
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
gs.infrastructure.mask = 0;

// Build index array from tree
//
function buildIndex(tree) {
  var result = [];
  var parseTree = function(index, depth, node) {
    var isBranch = !!node[0];
    if (isBranch) {
      parseTree(index, depth + 1, node[0]);
      parseTree(index + (1 << depth), depth + 1, node[1]);
    } else {
      result[index] = node;
    }
  };
  parseTree(0, 0, tree);

  var height = Math.ceil(Math.log(result.length) / Math.log(2));
  for (var i = result.length; i >= 0; i--) {
    var depth = Math.ceil(Math.log(i + 1) / Math.log(2));
    for (var j = 1; result[i] && j < 1 << height - depth; j++) {
      if (!result[i + (j << depth)]) {
        result[i + (j << depth)] = result[i];
      }
    }
  }
  return result;
}

// Assign new tnfrastructure tree
//
gs.infrastructure.assign = function(tree) {
  gs.infrastructure.servers = tree;
  var index = buildIndex(tree);
  gs.infrastructure.index = index;
  gs.infrastructure.bits = Math.log(index.length) / Math.log(2);
  gs.infrastructure.mask = Math.pow(2, gs.infrastructure.bits) - 1;
};

// Get server for id
//
gs.findServer = function(id) {
  return (
    gs.infrastructure.index[id & gs.infrastructure.mask]
  );
};

// Last id in storage
//
gs.nextId = 0;

// Get server for id
//
gs.generateId = function() {
  // TODO: implement id chunks for separate processes
  // This function not used now
  return gs.nextId++;
};
