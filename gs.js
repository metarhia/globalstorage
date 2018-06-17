'use strict';

const common = require('metarhia-common');

const core = require('./lib/core');
const transformations = require('./lib/transformations');
const operations = require('./lib/operations');

const submodules = [
  'provider', 'cursor',
  'memory.provider', 'memory.cursor',
  'remote.provider', 'remote.cursor',
  'fs.provider', 'fs.cursor',
  'mongodb.provider', 'mongodb.cursor',
  'localstorage.provider',
];

const lib = {};
submodules.forEach(name => Object.assign(lib, require('./lib/' + name)));

function GlobalStorage() {
  this.memory = new lib.MemoryProvider();
  this.local = null;
  this.remotes = {};
  this.active = false;
  this.offline = true;
  this.infrastructure = {};
  this.infrastructureTree = {};
  this.infrastructureIndex = [];
  this.infrastructureMask = 0;
  this.nextId = 0;
  this.categories = {};
}

common.inherits(GlobalStorage, lib.StorageProvider);

const gs = Object.assign(new GlobalStorage(), lib);
module.exports = gs;

gs.providers = {
  fs: gs.FsProvider,
  memory: gs.MemoryProvider,
  mongodb: gs.MongodbProvider
};

gs.cursors = {
  fs: gs.FsCursor,
  memory: gs.MemoryCursor,
  mongodb: gs.MongodbCursor
};

gs.transformations = transformations;
gs.operations = operations;

GlobalStorage.prototype.open = function(
  // Open database
  options, // options
  callback // callback
) {
  this.memory.open({ gs: options.gs });
  const providerName = options.provider || 'memory';
  const Provider = gs.providers[providerName];
  this.local = new Provider();
  this.active = true;
  this.local.open(options, callback);
};

GlobalStorage.prototype.connect = function(
  // Connect to Global Storage server
  options, // connection parammeters
  // Example: { url: 'gs://user:password@host:port/database' }
  callback // on connect function(err, connection)
) {
  const connection = new gs.RemoteProvider(options);
  callback(null, connection);
};

GlobalStorage.prototype.category = function(
  // Get Category
  name, // name of category
  callback // function(err, category)
) {
  let cat = this.categories[name];
  if (!cat) {
    cat = new core.Category(name);
    this.categories[name] = cat;
  }
  callback(null, cat);
};

GlobalStorage.prototype.get = function(
  // Get object by id
  id, // object id
  callback // function(err, object)
) {
  const get = (id, callback) => {
    this.local.get(id, (err, data) => {
      if (!err) {
        callback(null, data);
        return;
      }
      const sid = this.findServer(id);
      const connection = this.infrastructure.index[sid];
      connection.get(id, callback);
    });
  };

  this.memoryStorageProvider.get(id, (err, data) => {
    if (data) callback(null, data);
    else get(id, callback);
  });
};

GlobalStorage.prototype.create = function(
  // Create new object
  obj, // object
  callback // function(err, id)
) {
  this.local.create(obj, callback);
};

GlobalStorage.prototype.update = function(
  // Update Object
  obj, // object
  callback // function(err)
) {
  this.local.update(obj, callback);
};

GlobalStorage.prototype.delete = function(
  // Delete object
  id, // object id
  callback // function(err)
) {
  this.local.delete(id, callback);
};

GlobalStorage.prototype.select = function(
  // Select dataset
  query, // object
  options, // object
  callback // function(err, cursor)
) {
  return this.local.select(query, options, callback);
};

GlobalStorage.prototype.index = function(
  // Create index
  def, // declarative definotion
  callback // function(err)
) {
  this.local.index(def, callback);
};

GlobalStorage.prototype.infrastructureAssign = function(
  // Assign new infrastructure tree
  tree // new infrastructure tree
) {
  this.infrastructure.servers = tree;
  const index = core.buildIndex(tree);
  this.infrastructure.index = index;
  this.infrastructure.bits = Math.log(index.length) / Math.log(2);
  this.infrastructure.mask = Math.pow(2, this.infrastructure.bits) - 1;
};

GlobalStorage.prototype.findServer = function(
  // Get server for id
  id // object id
) {
  const prefix = id & this.infrastructure.mask;
  return this.infrastructure.index[prefix];
};

GlobalStorage.prototype.generateId = function(
  // Get server for id
  // This function not used now
) {
  return this.nextId++;
};

