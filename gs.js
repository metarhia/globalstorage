'use strict';

const util = require('util');

const constants = require('./lib/constants');
const infrastructure = require('./lib/infrastructure');
const transformations = require('./lib/transformations');
const operations = require('./lib/operations');

const StorageProvider = require('./lib/provider');

const FsProvider = require('./lib/provider.fs');
const MemoryProvider = require('./lib/provider.memory');
const MongodbProvider = require('./lib/provider.mongodb');

const FsCursor = require('./lib/cursor.fs');
const MemoryCursor = require('./lib/cursor.memory');
const MongodbCursor = require('./lib/cursor.mongodb');

const Category = require('./lib/category');
const Connection = require('./lib/connection');

function GlobalStorage() {
  this.memory = new MemoryProvider();
  this.active = false;
  this.offline = true;
  this.local = null;
  this.infrastructure = {};
  this.infrastructureTree = {};
  this.infrastructureIndex = [];
  this.infrastructureMask = 0;
  this.connections = {};
  this.nextId = 0;
  this.categories = {};
}

util.inherits(GlobalStorage, StorageProvider);

GlobalStorage.providers = {
  fs: FsProvider,
  memory: MemoryProvider,
  mongodb: MongodbProvider
};

GlobalStorage.prototype.constants = constants;
GlobalStorage.prototype.infrastructure = infrastructure;
GlobalStorage.prototype.transformations = transformations;
GlobalStorage.prototype.operations = operations;

GlobalStorage.prototype.FsCursor = FsCursor;
GlobalStorage.prototype.MemoryCursor = MemoryCursor;
GlobalStorage.prototype.MongodbCursor = MongodbCursor;

GlobalStorage.prototype.open = function(
  // Open database
  options, // options
  callback // callback
) {
  this.memory.open({ gs: options.gs });
  const providerName = options.provider || 'memory';
  const Provider = GlobalStorage.providers[providerName];
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
  const connection = new Connection(options);
  callback(null, connection);
};

GlobalStorage.prototype.category = function(
  // Get Category
  name, // name of category
  callback // function(err, category)
) {
  let cat = this.categories[name];
  if (!cat) {
    cat = new Category(name);
    this.categories[name] = cat;
  }
  callback(null, cat);
};

GlobalStorage.prototype.get = function(
  // Get object by id
  id, // object id
  callback // function(err, object)
) {
  this.memoryStorageProvider.get(id, (err, data) => {
    if (data) callback(null, data);
    else get(id, callback);
  });

  function get(id, callback) {
    this.local.get(id, (err, data) => {
      if (!err) {
        callback(null, data);
        return;
      }
      const sid = this.findServer(id);
      const connection = this.infrastructure.index[sid];
      connection.get(id, callback);
    });
  }
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
  const index = infrastructure.buildIndex(tree);
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

module.exports = new GlobalStorage();
