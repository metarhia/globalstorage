'use strict';

const core = require('./lib/core');
const transformations = require('./lib/transformations');
const operations = require('./lib/operations');

const submodules = [
  'provider', 'cursor',
  'memory.provider', 'memory.cursor',
  'remote.provider', 'remote.cursor',
  'fs.provider', 'fs.cursor'
];

let gs = null;
const lib = {};
submodules.forEach(name => Object.assign(lib, require('./lib/' + name)));

class GlobalStorage extends lib.StorageProvider {
  constructor() {
    super();
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

  open(
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
  }

  connect(
    // Connect to Global Storage server
    options, // connection parammeters
    // Example: { url: 'gs://user:password@host:port/database' }
    callback // on connect function(err, connection)
  ) {
    const connection = new gs.RemoteProvider(options);
    callback(null, connection);
  }

  get(
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
  }

  create(
    // Create new object
    obj, // object
    callback // function(err, id)
  ) {
    this.local.create(obj, callback);
  }

  update(
    // Update Object
    obj, // object
    callback // function(err)
  ) {
    this.local.update(obj, callback);
  }

  delete(
    // Delete object
    id, // object id
    callback // function(err)
  ) {
    this.local.delete(id, callback);
  }

  select(
    // Select dataset
    query, // object
    options, // object
    callback // function(err, cursor)
  ) {
    return this.local.select(query, options, callback);
  }

  infrastructureAssign(
    // Assign new infrastructure tree
    tree // new infrastructure tree
  ) {
    this.infrastructure.servers = tree;
    const index = core.buildIndex(tree);
    this.infrastructure.index = index;
    this.infrastructure.bits = Math.log(index.length) / Math.log(2);
    this.infrastructure.mask = Math.pow(2, this.infrastructure.bits) - 1;
  }

  findServer(
    // Get server for id
    id // object id
  ) {
    const prefix = id & this.infrastructure.mask;
    return this.infrastructure.index[prefix];
  }

  generateId(
    // Get server for id
    // This function not used now
  ) {
    return this.nextId++;
  }
}

gs = Object.assign(new GlobalStorage(), lib);

gs.providers = {
  fs: gs.FsProvider,
  memory: gs.MemoryProvider
};

gs.cursors = {
  fs: gs.FsCursor,
  memory: gs.MemoryCursor
};

gs.transformations = transformations;
gs.operations = operations;

module.exports = gs;
