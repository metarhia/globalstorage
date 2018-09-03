'use strict';

const common = require('metarhia-common');

const core = require('./core');

function Cursor() {
  this.parent = null;
  this.provider = null;
  this.dataset = [];
  this.children = [];
  this.jsql = [];
  this.schema = null;
}

Cursor.prototype.definition = function(
  // Attach schema
  schema // object, schema
  // Return: previous instance
) {
  this.schema = schema;
  return this;
};

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
  if (this.schema) cursor.definition(this.schema);
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
  if (typeof fields === 'string') fields = [fields];
  this.jsql.push({ op: 'order', fields });
  return this;
};

Cursor.prototype.desc = function(
  // Declarative lazy descending sort
  fields // field name or array of names
  // Return: previous instance from chain
) {
  if (typeof fields === 'string') fields = [fields];
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
  done // callback function(err, dataset, cursor)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED), null, this);
  return this;
};

module.exports = { Cursor };
