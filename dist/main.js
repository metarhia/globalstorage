/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const core = __webpack_require__(3);
const transformations = __webpack_require__(4);
const operations = __webpack_require__(5);

const submodules = [
  'provider', 'cursor',
  'memory.provider', 'memory.cursor',
  'remote.provider', 'remote.cursor',
  'fs.provider', 'fs.cursor',
  'mongodb.provider', 'mongodb.cursor',
  'localstorage.provider',
];

const lib = {};
submodules.forEach(name => Object.assign(lib, __webpack_require__(6)("./" + name)));

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



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const submodules = [
  'utilities', // Common utilities
  'math', // Math common function
  'array', // Arrays manipulations
  'data', // Data structures manipulations
  'strings', // Strings utilities
  'time', // Data and Time functions
  'fp', // Functional programming
  'oop', // Object-oriented programming
  'callbacks', // Callback utilities
  'events', // Events and emitter
  'units', // Units conversion
  'network', // Network utilities
  'id', // Kyes and identifiers
  'sort', // Sort compare functions
  'cache', // Cache (enhanced Map)
  'mp', // Metaprogramming
].map(path => './lib/' + path).map(__webpack_require__(2));

module.exports = Object.assign({}, ...submodules);


/***/ }),
/* 2 */
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	var e = new Error('Cannot find module "' + req + '".');
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = 2;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const NOT_IMPLEMENTED = 'Not implemented';

const Category = function(name) {
  this.name = name;
};

const buildIndex = (
  // Build index array from tree
  tree
) => {
  const result = [];
  const parseTree = (index, depth, node) => {
    const isBranch = !!node[0];
    if (isBranch) {
      parseTree(index, depth + 1, node[0]);
      parseTree(index + (1 << depth), depth + 1, node[1]);
    } else {
      result[index] = node;
    }
  };
  parseTree(0, 0, tree);

  const height = Math.ceil(Math.log(result.length) / Math.log(2));
  let i, j, depth;
  for (i = result.length; i >= 0; i--) {
    depth = Math.ceil(Math.log(i + 1) / Math.log(2));
    for (j = 1; result[i] && j < 1 << height - depth; j++) {
      if (!result[i + (j << depth)]) {
        result[i + (j << depth)] = result[i];
      }
    }
  }
  return result;
};

module.exports = {
  buildIndex,
  Category,
  NOT_IMPLEMENTED
};


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const row = (
  // Get dataset row
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: [1, 'Marcus']
) => {
  const result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    let key;
    for (key in obj) {
      result.push(obj[key]);
    }
  }
  return result;
};

const col = (
  // Get dataset column
  ds, // array of records, example: [ { id: 1 }, { id: 2 }, { id: 3 } ]
  field // optional, field name
  // Result: result array of records, example: [1, 2, 3]
) => {
  let result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    field = field || Object.keys(ds[0])[0];
    result = ds.map(record => record[field]);
  }
  return result;
};

const header = (
  // Get dataset header
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: ['id', 'name']
) => {
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    return Object.keys(obj);
  } else {
    return [];
  }
};

const projection = (
  // Dataset projection
  meta, // projection metadata, example: ['name']
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: [ { name: 'Marcus' } ]
) => {
  const fields = meta;
  return ds.map((record) => {
    const row = {};
    fields.forEach((field) => {
      row[field] = record[field];
    });
    return row;
  });
};

const union = (
  // Set union
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: array of records, example: [ { id: 1 }, { id: 2 }, { id: 3 } ]
) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  let i, item;
  for (i = 0; i < l1; i++) {
    item = ds1[i];
    ids.push(item.id);
    ds.push(item);
  }
  for (i = 0; i < l2; i++) {
    item = ds2[i];
    if (ids.indexOf(item.id) < 0) {
      ids.push(item.id);
      ds.push(item);
    }
  }
  return ds;
};

const intersection = (
  // Set intersection
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 2 } ]
) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  let i, item;
  for (i = 0; i < l1; i++) {
    item = ds1[i];
    ids.push(item.id);
  }
  for (i = 0; i < l2; i++) {
    item = ds2[i];
    if (ids.indexOf(item.id) >= 0) {
      ds.push(item);
    }
  }
  return ds;
};

const difference = (
  // Set difference
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 1 } ]
) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  let i, item;
  for (i = 0; i < l2; i++) {
    item = ds2[i];
    ids.push(item.id);
  }
  for (i = 0; i < l1; i++) {
    item = ds1[i];
    if (ids.indexOf(item.id) < 0) {
      ds.push(item);
    }
  }
  return ds;
};

const complement = (
  // Set complement
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 3 } ]
) => (
  difference(ds2, ds1)
);

const compare = (value, op, data) => {
  if (op === '=') return value === data;
  if (op === '<') return value < data;
  if (op === '>') return value > data;
  if (op === '<=') return value <= data;
  if (op === '>=') return value >= data;
  return false;
};

const condition = (def) => {
  const c0 = def[0];
  const eq = c0 === '=';
  const nt = c0 === '!';
  if (eq || nt) return [c0, def.substr(1).trim()];
  const c1 = def[1];
  const et = c1 === '=';
  const lt = c0 === '<';
  const gt = c0 === '>';
  if (lt || gt) {
    if (et) return [c0 + c1, def.substr(2).trim()];
    else return [c0, def.substr(1).trim()];
  }
  return ['=', def];
};

const constraints = (defs, prepare = condition) => {
  const keys = Object.keys(defs);
  const prepared = {};
  let i, key, def;
  const len = keys.length;
  for (i = 0; i < len; i++) {
    key = keys[i];
    def = defs[key];
    prepared[key] = prepare(def);
  }
  return prepared;
};

module.exports = {
  row,
  col,
  header,
  projection,
  union,
  intersection,
  difference,
  complement,
  compare,
  condition,
  constraints
};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const transformations = __webpack_require__(4);

const select = (operation, dataset) => {
  const query = operation.query;
  const constraints = transformations.constraints(query);
  const fields = Object.keys(query);
  const compare = transformations.compare;
  return dataset.filter(record => {
    let i, field, value, op, data, keep;
    for (i = 0; i < fields.length; i++) {
      field = fields[i];
      value = record[field];
      [op, data] = constraints[field];
      keep = compare(value, op, data);
      if (!keep) return false;
    }
    return true;
  });
};

const distinct = (operation, dataset) => {
  const keys = new Set();
  let fields = operation.fields;
  if (typeof(operation) === 'string') fields = [fields];
  return dataset.filter((record) => {
    const cols = fields || Object.keys(record).sort();
    const key = cols.map(field => record[field]).join('\x00');
    const has = keys.has(key);
    keys.add(key);
    return !has;
  });
};

const order = (operation, dataset) => {
  let fields = operation.fields;
  if (typeof(operation) === 'string') fields = [fields];
  dataset.sort((r1, r2) => {
    const a1 = fields.map(field => r1[field]).join('\x00');
    const a2 = fields.map(field => r2[field]).join('\x00');
    if (a1 < a2) return -1;
    if (a1 > a2) return 1;
    return 0;
  });
  return dataset;
};

const desc = (operation, dataset) => {
  let fields = operation.fields;
  if (typeof(operation) === 'string') fields = [fields];
  dataset.sort((r1, r2) => {
    const a1 = fields.map(field => r1[field]).join('\x00');
    const a2 = fields.map(field => r2[field]).join('\x00');
    if (a1 < a2) return 1;
    if (a1 > a2) return -1;
    return 0;
  });
  return dataset;
};

const projection = (operation, dataset) => (
  transformations.projection(operation.fields, dataset)
);

const row = (operation, dataset) => (
  transformations.row(dataset)
);

const col = (operation, dataset) => (
  transformations.col(dataset, operation.field)
);

const one = (operation, dataset) => (
  dataset[0]
);

const union = (operation, dataset) => (
  transformations.union(dataset, operation.cursor.dataset)
);

const intersection = (operation, dataset) => (
  transformations.intersection(dataset, operation.cursor.dataset)
);

const difference = (operation, dataset) => (
  transformations.difference(dataset, operation.cursor.dataset)
);

const complement = (operation, dataset) => (
  transformations.complement(dataset, operation.cursor.dataset)
);

module.exports = {
  select,
  distinct,
  order,
  desc,
  projection,
  row,
  col,
  one,
  union,
  intersection,
  difference,
  complement
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./core": 3,
	"./core.js": 3,
	"./cursor": 7,
	"./cursor.js": 7,
	"./fs.cursor": 8,
	"./fs.cursor.js": 8,
	"./fs.provider": 9,
	"./fs.provider.js": 10,
	"./localstorage.provider": 11,
	"./localstorage.provider.js": 11,
	"./memory.cursor": 13,
	"./memory.cursor.js": 13,
	"./memory.provider": 14,
	"./memory.provider.js": 14,
	"./mongodb.cursor": 15,
	"./mongodb.cursor.js": 15,
	"./mongodb.provider": 16,
	"./mongodb.provider.js": 16,
	"./operations": 5,
	"./operations.js": 5,
	"./provider": 12,
	"./provider.js": 12,
	"./remote.cursor": 18,
	"./remote.cursor.js": 18,
	"./remote.provider": 19,
	"./remote.provider.js": 19,
	"./transformations": 4,
	"./transformations.js": 4
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	var module = __webpack_require__(id);
	return module;
}
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) { // check for number or string
		var e = new Error('Cannot find module "' + req + '".');
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return id;
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 6;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const core = __webpack_require__(3);

function Cursor() {
  this.parent = null;
  this.provider = null;
  this.dataset = [];
  this.children = [];
  this.jsql = [];
}

Cursor.prototype.copy = function(
  // Copy references to new dataset
  // Return: new Cursor instance
) {
  return new Error(core.NOT_IMPLEMENTED);
};

Cursor.prototype.clone = function(
  // Clone all dataset objects
  // Return: new Cursor instance
) {
  return new Error(core.NOT_IMPLEMENTED);
};

Cursor.prototype.enroll = function(
  // Apply JSQL commands to dataset
  jsql // commands array
  // Return: previous instance
) {
  this.jsql = this.jsql.concat(jsql);
  return this;
};

Cursor.prototype.empty = function(
  // Remove all instances from dataset
  // Return: previous instance from chain
) {
  return new Error(core.NOT_IMPLEMENTED);
};

Cursor.prototype.from = function(
  // Synchronous virtualization converts Array to Cursor
  arr // array or iterable
  // Return: new Cursor instance
) {
  if (Array.isArray(arr)) {
    return new Error(core.NOT_IMPLEMENTED);
  }
};

Cursor.prototype.map = function(
  // Lazy map
  fn // map function
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'map', fn });
  return this;
};

Cursor.prototype.projection = function(
  // Declarative lazy projection
  mapping // projection metadata array of field names
  // or structure: [ { toKey: [ fromKey, functions... ] } ]
  // Return: previous instance from chain
) {
  if (Array.isArray(mapping)) {
    // Array of field names
    this.jsql.push({ op: 'projection', fields: mapping });
  } else {
    // Object describing mappings
    this.jsql.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

Cursor.prototype.filter = function(
  // Lazy functional filter
  fn // filtering function
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'filter', fn });
  return this;
};

Cursor.prototype.select = function(
  // Declarative lazy filter
  query // filter expression
  // Return: new Cursor instance
) {
  const cursor = new Cursor.MemoryCursor();
  cursor.parent = this;
  cursor.jsql.push({ op: 'select', query });
  return cursor;
};

Cursor.prototype.distinct = function(
  // Lazy functional distinct filter
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'distinct' });
  return this;
};

Cursor.prototype.find = function(
  // Lazy functional find (legacy)
  query, // find expression
  options // find options
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'find', query, options });
  return this;
};

Cursor.prototype.sort = function(
  // Lazy functional sort
  fn // compare function
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'sort', fn });
  return this;
};

Cursor.prototype.order = function(
  // Declarative lazy ascending sort
  fields // field name or array of names
  // Return: previous instance from chain
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'order', fields });
  return this;
};

Cursor.prototype.desc = function(
  // Declarative lazy descending sort
  fields // field name or array of names
  // Return: previous instance from chain
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'desc', fields });
  return this;
};

Cursor.prototype.count = function(
  // Calculate count async
  done // callback on done function(err, count)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.sum = function(
  // Calculate sum async
  done // callback on done function(err, sum)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.avg = function(
  // Calculate avg async
  done // callback on done function(err, avg)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.max = function(
  // Calculate max async
  done // callback on done function(err, max)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.min = function(
  // Calculate min async
  done // callback on done function(err, min)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.median = function(
  // Calculate median async
  done // callback on done function(err, median)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.mode = function(
  // Calculate mode async
  done // callback on done function(err, mode)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.col = function(
  // Convert first column of dataset to Array
  done // callback on done function(err, mode)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.row = function(
  // Return first row from dataset
  done // callback on done function(err, mode)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.one = function(
  // Get single first record from dataset
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'one' });
  return this;
};

Cursor.prototype.limit = function(
  // Get first n records from dataset
  n // Number
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'limit', count: n });
  return this;
};

Cursor.prototype.union = function(
  // Calculate union and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'union', cursor });
  return this;
};

Cursor.prototype.intersection = function(
  // Calculate intersection and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'intersection', cursor });
  return this;
};

Cursor.prototype.difference = function(
  // Calculate difference and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'difference', cursor });
  return this;
};

Cursor.prototype.complement = function(
  // Calculate complement and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'complement', cursor });
  return this;
};

Cursor.prototype.fetch = function(
  // Get results after allying consolidated jsql
  done // callback function(err, dataset)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

module.exports = { Cursor };


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const { Cursor } = __webpack_require__(7);

function FsCursor() {
  Cursor.call(this);
}

common.inherits(FsCursor, Cursor);

module.exports = { FsCursor };


/***/ }),
/* 9 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 10 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-env browser */

const common = __webpack_require__(1);
const { StorageProvider } = __webpack_require__(12);
const { MemoryCursor } = __webpack_require__(13);

function LocalstorageProvider() {}

common.inherits(LocalstorageProvider, StorageProvider);

// Key of object containing current global id
LocalstorageProvider.ID_LABEL = '_LocalstorageProviderId';
// Prefix for globalstorage objects in localstorage
LocalstorageProvider.ID_ITEM_LABEL = '_LocalstorageProvider_item_';

LocalstorageProvider.prototype.open = (options = {}, callback) => {
  StorageProvider.prototype.open.call(this, options, () => {
    let localStorage = null;
    /* eslint-disable no-var */
    var window;
    /* eslint-enable no-var */
    if (window) localStorage = window.localStorage;
    if (!options.localStorage && !localStorage) {
      const err =
        new Error('There is no window.indexedDb and options.indexedDb');
      return callback(err);
    }
    options.localStorage = options.localStorage || localStorage;
    this.options = options;
  });
};

LocalstorageProvider.prototype.close = (callback) => (
  common.once(callback)(null)
);

LocalstorageProvider.prototype.generateId = (callback) => {
  callback = common.once(callback);
  const id = +localStorage[LocalstorageProvider.ID_LABEL];
  localStorage[LocalstorageProvider.ID_LABEL] = id + 1;
  callback(null, id);
};

LocalstorageProvider.prototype.get = (id, callback) => {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + id;
  const obj = localStorage[key];
  callback(null, obj ? JSON.parse(obj) : obj);
};


LocalstorageProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) return callback(err);
    obj.id = id;
    const key = LocalstorageProvider.ID_ITEM_LABEL + id;
    localStorage[key] = JSON.stringify(obj);
    callback(null, id);
  });
};

LocalstorageProvider.prototype.update = (obj, callback) => {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + obj.id;
  localStorage[key] = JSON.stringify(obj);
  callback(null);
};

LocalstorageProvider.prototype.delete = (id, callback) => {
  callback = common.once(callback);
  const key = LocalstorageProvider.ID_ITEM_LABEL + id;
  localStorage.removeItem(key);
  callback(null);
};

LocalstorageProvider.prototype.select = (query, options) => {
  const ds = Object.keys(localStorage)
    .filter(id => id.startsWith(LocalstorageProvider.ID_ITEM_LABEL))
    .map(id => JSON.parse(localStorage[id]));
  const cursor = new MemoryCursor(ds);
  cursor.provider = this;
  cursor.jsql.push({ op: 'select', query, options });
  return cursor;
};

LocalstorageProvider.prototype.index = (def, callback) => {
  callback.once(callback)(null);
};

module.exports = { LocalstorageProvider };


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const core = __webpack_require__(3);

function StorageProvider(
  // Abstract Storage Provider
) {}

StorageProvider.prototype.open = function(
  // Open storage provider
  options, // object
  callback // callback function after open
) {
  callback = common.once(callback);
  this.options = options;
  if (options) {
    this.gs = options.gs;
    this.db = options.db;
    this.client = options.client;
  }
  callback();
};

StorageProvider.prototype.close = function(
  // Close storage provider
  callback // callback function after close
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.category = function(
  // Create category to access objects in it
  name // category name
  // Return: Category instance
) {
  return { name };
};

StorageProvider.prototype.generateId = function(
  callback // function(err, id)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.get = function(
  // Get object from Global Storage
  id, // globally unique object id
  callback // function(err, obj)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.create = function(
  // Create object in Global Storage
  obj, // object to be stored
  callback // function(err, id)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.update = function(
  // Update object in Global Storage
  obj, // { id } object with globally unique object id
  callback // function(err)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.delete = function(
  // Delete object in Global Storage
  id, // globally unique object id
  callback // function(err)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.select = function(
  // Select objects from Global Storage
  query, // JSQL lambda expression
  options, // { order, limit }
  // order - order key field name
  // limit - top n records
  callback // function(err, data)
  // data - array of object
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.index = function(
  // Create index
  def, // { category, fields, unique, background }
  // category - category name
  // fields - array of field names
  // unique - bool flag, default false
  // background - bool flag, default true
  callback // function(err)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

module.exports = { StorageProvider };


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const operations = __webpack_require__(5);
const { Cursor } = __webpack_require__(7);

function MemoryCursor(dataset) {
  Cursor.call(this);
  this.dataset = dataset;
  this.indices = {};
}

common.inherits(MemoryCursor, Cursor);
Cursor.MemoryCursor = MemoryCursor;

MemoryCursor.prototype.copy = function() {
  const dataset = common.copy(this.dataset);
  return new MemoryCursor(dataset);
};

MemoryCursor.prototype.clone = function() {
  const dataset = common.clone(this.dataset);
  return new MemoryCursor(dataset);
};

MemoryCursor.prototype.empty = function() {
  this.dataset.length = 0;
  this.jsql.length = 0;
  return this;
};

MemoryCursor.prototype.from = function(arr) {
  this.dataset = common.copy(arr);
  return this;
};

MemoryCursor.prototype.count = function(done) {
  done = common.once(done);
  done(null, this.dataset.length);
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  done = common.once(done);

  const process = dataset => {
    this.jsql.forEach(operation => {
      const fn = operations[operation.op];
      if (fn) {
        dataset = fn(operation, dataset);
      }
    });
    this.jsql.length = 0;
    done(null, dataset);
  };

  if (this.parent) {
    this.parent.fetch((err, dataset) => process(dataset));
  } else {
    const dataset = common.clone(this.dataset);
    process(dataset);
  }
  return this;
};

module.exports = { MemoryCursor };


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const core = __webpack_require__(3);
const { StorageProvider } = __webpack_require__(12);

function MemoryProvider() {
  StorageProvider.call(this);
}

common.inherits(MemoryProvider, StorageProvider);

MemoryProvider.prototype.open = function(options, callback) {
  StorageProvider.prototype.open.call(this, options, callback);
};

MemoryProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  callback();
};

MemoryProvider.prototype.category = function(name) {
  return { name };
};

MemoryProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.dataset.push(obj);
  callback();
};

MemoryProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.delete = function(id, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

module.exports = { MemoryProvider };


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const transformations = __webpack_require__(4);
const operations = __webpack_require__(5);
const { Cursor } = __webpack_require__(7);

function MongodbCursor(cursor) {
  Cursor.call(this);
  this.cursor = cursor;
}

common.inherits(MongodbCursor, Cursor);

MongodbCursor.prototype.clone = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(mc);
  cursor.provider = this.provider;
  cursor.parent = this.parent;
  cursor.jsql = common.clone(this.jsql);
  return cursor;
};

MongodbCursor.prototype.modify = function(changes, done) {
  done = common.once(done);
  if (this.jsql.length > 0) {
    const select = this.jsql[0];
    if (select.op === 'select') {
      const category = this.provider.category(select.query.category);
      category.updateMany(select.query, { $set: changes }, { w: 1 }, done);
    }
  }
};

MongodbCursor.prototype.projection = function(mapping) {
  const fields = this.provider.fields(mapping);
  fields._id = 1;
  this.cursor.project(fields);
  return this;
};

MongodbCursor.prototype.order = function(by) {
  if (!Array.isArray(by)) by = [by];
  const fields = this.provider.fields(by);
  this.cursor.sort(fields);
  return this;
};

MongodbCursor.prototype.limit = function(n) {
  this.cursor.limit(n);
  return this;
};

MongodbCursor.prototype.fetch = function(done) {
  done = common.once(done);
  this.cursor.toArray((err, dataset) => {
    if (err) {
      done(err);
      return;
    }
    this.jsql.forEach(operation => {
      const fn = operations[operation.op];
      if (fn) {
        dataset = fn(operation, dataset);
      }
    });
    this.jsql.length = 0;
    done(null, dataset);
    return this;
  });
  return this;
};

MongodbCursor.prototype.next = function(done) {
  done = common.once(done);
  this.cursor.nextObject((err, record) => {
    if (err) {
      done(err);
      return;
    }
    let data = [record];
    this.jsql.forEach((item) => {
      if (item.op === 'projection') {
        data = transformations.projection(item.fields, data);
      } else if (item.op === 'row') {
        data = transformations.row(data);
      } else if (item.op === 'col') {
        data = transformations.col(data);
      } else if (item.op === 'one') {
        data = data[0];
      }
    });
    done(null, data[0]);
  });
  return this;
};

module.exports = { MongodbCursor };


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

const common = __webpack_require__(1);

const transformations = __webpack_require__(4);
const { StorageProvider } = __webpack_require__(12);
const { MongodbCursor } = __webpack_require__(15);

const DUPLICATE_KEY = 11000;

const constraints = defs => transformations.constraints(defs, def => {
  const c0 = def[0];
  const eq = c0 === '=';
  const nt = c0 === '!';
  if (eq || nt) {
    const val = def.substr(1).trim();
    const value = parseFloat(val) || val;
    if (eq) return value;
    if (nt) return { $ne: value };
  }
  const c1 = def[1];
  const et = c1 === '=';
  const lt = c0 === '<';
  const gt = c0 === '>';
  if (lt || gt) {
    if (et) {
      const val = def.substr(2).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lte: value };
      else return { $gte: value };
    } else {
      const val = def.substr(1).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lt: value };
      else return { $gt: value };
    }
  }
  return def;
});

function MongodbProvider() {
  StorageProvider.call(this);
  this.stat = null;
}

common.inherits(MongodbProvider, StorageProvider);

MongodbProvider.prototype.open = function(options, callback) {
  callback = common.once(callback);
  StorageProvider.prototype.open.call(this, options, () => {
    if (this.db) {
      this.storage = this.db.collection('gsStorage');
      this.metadata = this.db.collection('gsMetadata');
      this.metadata.findOne({ _id: 0 }, (err, data) => {
        if (data) {
          delete data._id;
          //this.gs.infrastructure.assign(data.tree);
          this.stat = data;
          callback();
        } else {
          const metadata = { _id: 0, next: 0, tree: {} };
          this.metadata.insertOne(metadata, callback);
        }
      });
    }
  });
};

MongodbProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  if (this.client) this.client.close(callback);
  else callback();
};

MongodbProvider.prototype.category = function(name) {
  return this.db.collection('c' + name);
};

MongodbProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  this.metadata.findAndModify(
    { _id: 0 }, null,
    { $inc: { next: 1 } },
    { upsert: true, new: true },
    (err, res) => {
      if (err) {
        if (err.code === DUPLICATE_KEY) {
          process.nextTick(() => {
            this.generateId(callback);
          });
        } else {
          callback(err);
        }
        return;
      }
      callback(null, res.value.next);
    }
  );
};

MongodbProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  this.storage.findOne({ _id: id }, (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    const category = this.category(data.category);
    category.findOne({ _id: id }, (err, data) => {
      if (data) data.id = data._id;
      callback(err, data);
    });
  });
};

MongodbProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) {
      callback(err);
      return;
    }
    obj._id = id;
    obj.id = id;
    const index = { _id: id, category: obj.category };
    this.storage.insertOne(index, (err) => {
      if (err) {
        callback(err);
        return;
      }
      const category = this.category(obj.category);
      category.insertOne(obj, (err) => {
        if (err) callback(err);
        else callback(null, id);
      });
    });
  });
};

MongodbProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  obj._id = obj.id;
  this.storage.findOne({ _id: obj._id }, (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    const category = this.category(data.category);
    category.updateOne(
      { _id: obj._id }, obj, { upsert: true, w: 1 }, callback
    );
  });
};

MongodbProvider.prototype.delete = function(query, callback) {
  callback = common.once(callback);
  const qtype = typeof(query);
  if (qtype === 'object') {
    if (query.category) {
      const category = this.category(query.category);
      category.deleteMany(query);
      this.storage.deleteMany(query, callback);
      return;
    }
  }
  if (qtype === 'number') {
    this.storage.findOne({ _id: query }, (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      const category = this.category(data.category);
      category.deleteOne({ _id: query });
      this.storage.deleteOne({ _id: query }, callback);
    });
  }
  callback(new Error('Nothing to delete'));
};

MongodbProvider.prototype.select = function(query, options, callback) {
  const category = this.category(query.category);
  const prepared = constraints(query);
  delete prepared.category;
  const cursor = category.find(prepared);
  if (callback) {
    cursor.toArray((err, data) => {
      if (err) {
        callback(err);
        return;
      }
      data.forEach((obj) => {
        obj.id = obj._id;
      });
      callback(null, data);
    });
  } else {
    const mc = new MongodbCursor(cursor);
    mc.provider = this;
    mc.jsql.push({ op: 'select', query, options });
    return mc;
  }
};

MongodbProvider.prototype.fields = (list) => {
  const fields = {};
  list.forEach(field => fields[field] = 1);
  return fields;
};

MongodbProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  const category = this.category(def.category);
  const keys = this.fields(def.fields);
  const options = {
    unique: def.unique !== undefined ? def.unique : false,
    sparse: def.nullable !== undefined ? def.nullable : false,
    background: def.background !== undefined ? def.background : true
  };
  category.createIndex(keys, options, callback);
};

module.exports = { MongodbProvider };

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(17)))

/***/ }),
/* 17 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const { Cursor } = __webpack_require__(7);

function RemoteCursor() {
  Cursor.call(this);
}

common.inherits(RemoteCursor, Cursor);

module.exports = { RemoteCursor };


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(1);

const { StorageProvider } = __webpack_require__(12);

function RemoteProvider() {
  StorageProvider.call(this);
}

common.inherits(RemoteProvider, StorageProvider);

module.exports = { RemoteProvider };


/***/ })
/******/ ]);