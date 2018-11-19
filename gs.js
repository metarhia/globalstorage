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

  // Open database
  //   options - <Object>
  //   callback - <Function>
  open(options, callback) {
    this.memory.open({ gs: options.gs });
    const providerName = options.provider || 'memory';
    const Provider = gs.providers[providerName];
    this.local = new Provider();
    this.active = true;
    this.local.open(options, callback);
  }

  // Connect to Global Storage server
  //   options - <Object>, connection parameters
  //   callback - <Function>, called on connect
  //     err - <Error> | <null>
  //     connection - <Object>, gs.RemoteProvider
  //
  // Example:
  // connect({ url: 'gs://user:password@host:port/database' },
  //   (err, connection) => { ... });
  connect(options, callback) {
    const connection = new gs.RemoteProvider(options);
    callback(null, connection);
  }

  // Get object by id
  //   id - <string>, object id
  //   callback - <Function>
  //     err - <Error> | <null>
  //     data - <Object>
  get(id, callback) {
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

  // Create new object
  //   obj - <Object>
  //   callback - <Function>
  //     err - <Error> | <null>
  //     id - <string>
  create(obj, callback) {
    this.local.create(obj, callback);
  }

  // Update Object
  //   obj - <Object>
  //   callback - <Function>
  //     err - <Error> | <null>
  update(obj, callback) {
    this.local.update(obj, callback);
  }

  // Delete object
  //   id - <string>, object id
  //   callback - <Function>
  //     err - <Error> | <null>
  delete(id, callback) {
    this.local.delete(id, callback);
  }

  // Select dataset
  //   query - <Object>
  //   options - <Object>
  //   callback - <Function>
  //     err - <Error> | <null>
  //     cursor - <MemoryCursor>
  select(query, options, callback) {
    return this.local.select(query, options, callback);
  }

  // Get server for id
  //   id - <string>, object id
  findServer(id) {
    return id;
  }

  // Get server for id
  // This function is not used now
  generateId() {
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
