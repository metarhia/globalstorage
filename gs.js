'use strict';

const transformations = require('./lib/transformations');
const operations = require('./lib/operations');
const { createRemoteProviderJstpApi } =
  require('./lib/remote.provider.jstp.api.js');
const common = require('@metarhia/common');

const submodules = [
  'provider', 'cursor',
  'memory.provider', 'memory.cursor',
  'remote.provider', 'remote.cursor',
  'fs.provider', 'fs.cursor',
  'pg.provider', 'pg.cursor',
];

let gs = null;
const lib = {};
submodules.forEach(name => Object.assign(lib, require('./lib/' + name)));

class GlobalStorage extends lib.StorageProvider {
  constructor(ids) {
    super();
    this.memory = new lib.MemoryProvider();
    this.local = null;
    this.remotes = {};
    this.active = false;
    this.offline = true;
    this.nextId = 0;
    this.categories = {};
    this.serverBitmask = ids.serverBitmask;
    this.serverSuffix = ids.serverSuffix;
    this.systemSuffix = ids.systemSuffix;
    this.systemBitmask = ids.systemBitmask;
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
      });
    };

    this.memoryStorageProvider.get(id, (err, data) => {
      if (err) {
        callback(err);
        return;
      }
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

  findServer(
    // Get server for id
    id // object id
  ) {
    return id;
  }

  generateId(
    // Get server for id
    // This function not used now
  ) {
    return this.nextId++;
  }

  // Get system suffix for given id
  //   id - <common.Uint64>
  //
  // Returns: <common.Uint64>
  getSystemSuffix(id) {
    return common.Uint64.and(id, this.systemBitmask);
  }

  // Check whether data with given id is stored on this system
  //   id - <common.Uint64>
  //
  // Returns: <boolean>
  curSystem(id) {
    return common.Uint64.cmp(this.getSystemSuffix(id),
      this.systemSuffix) === 0;
  }

  // Get server suffix for given id
  //   id - <common.Uint64>
  //
  // Returns: <common.Uint64>
  getServerSuffix(id) {
    return common.Uint64.and(id, this.serverBitmask);
  }

  // Check whether data with given id is stored on this server
  //   id - <common.Uint64>
  //
  // Returns: <boolean>
  curServer(id) {
    return common.Uint64.cmp(this.getServerSuffix(id),
      this.serverSuffix) === 0;
  }

  // Get id without system and server suffix
  //   id - <common.Uint64>
  //
  // Returns: <common.Uint64>
  getLocalId(id) {
    return common.Uint64.and(common.Uint64.not(this.serverBitmask), id);
  }

  // Parse id
  //   id - <common.Uint64>
  //
  // Returns: <Object>
  //   systemSuffix - <common.Uint64>, system suffix for given id
  //   serverSuffix - <common.Uint64>, server suffix for given id
  //   localId - <common.Uint64>, id without system and server suffix
  parseId(id) {
    return {
      systemSuffix: this.getSystemSuffix(id),
      serverSuffix: this.getServerSuffix(id),
      localId: this.getLocalId(id),
    };
  }
}

gs = Object.assign(new GlobalStorage({}), lib);

gs.providers = {
  fs: gs.FsProvider,
  memory: gs.MemoryProvider,
  pg: gs.PostgresProvider,
};

gs.cursors = {
  fs: gs.FsCursor,
  memory: gs.MemoryCursor,
  pg: gs.PostgresCursor,
};

gs.transformations = transformations;
gs.operations = operations;

gs.createRemoteProviderJstpApi = createRemoteProviderJstpApi;

module.exports = gs;
