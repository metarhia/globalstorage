'use strict';

const submodules = [
  'memory.provider',
  'remote.provider',
  'fs.provider',
  'pg.provider',
];

const api = {};
submodules.forEach(name => Object.assign(api, require('./lib/' + name)));

const providers = {
  fs: api.FsProvider,
  memory: api.MemoryProvider,
  pg: api.PostgresProvider,
  remote: api.RemoteProvider,
};

// Create provider
//   provider <string> provider name
//   options <Object>
//     serverSuffix <Uint64> optional
//     serverBitmask <Uint64> optional
//     systemSuffix <Uint64> optional
//     systemBitmas <Uint64> optional
// Static properties:
//   schemaConfig <Object> metaschema config
const gs = (provider, options) => new providers[provider](options);

gs.schemaConfig = require('./lib/metaschema-config/config.js');

module.exports = gs;
