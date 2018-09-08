'use strict';

const common = require('metarhia-common');

const core = require('./core');

const defaultOptions = {
  category: null,
  schema: null,
  provider: null,
};

class Cursor {
  constructor(options) {
    this.dataset = [];
    this.children = [];
    Object.assign(this, defaultOptions, options);
    this.jsql = options && options.jsql ? options.jsql.slice() : [];
    this.parents = options && options.parents ? options.parents.slice() : [];
  }

  // Attach schema
  //   schema, // object, schema
  //   category // string, schema name
  // Returns: this instance
  definition(schema, category) {
    this.schema = schema;
    this.category = category;
    return this;
  }

  copy(
    // Copy references to new dataset
    // Return: new Cursor instance
  ) {
    return new Error(core.NOT_IMPLEMENTED);
  }

  clone(
    // Clone all dataset objects
    // Return: new Cursor instance
  ) {
    return new Error(core.NOT_IMPLEMENTED);
  }

  enroll(
    // Apply JSQL commands to dataset
    jsql // commands array
    // Return: previous instance
  ) {
    this.jsql = this.jsql.concat(jsql);
    return this;
  }

  empty(
    // Remove all instances from dataset
    // Return: previous instance from chain
  ) {
    return new Error(core.NOT_IMPLEMENTED);
  }

  from(
    // Synchronous virtualization converts Array to Cursor
    arr // array or iterable
    // Return: new Cursor instance
  ) {
    if (Array.isArray(arr)) {
      return new Error(core.NOT_IMPLEMENTED);
    }
  }

  map(
    // Lazy map
    fn // map function
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'map', fn });
    return this;
  }

  projection(
    // Declarative lazy projection
    metadata // projection metadata array of field names
    // or structure: [ { toKey: [ fromKey, functions... ] } ]
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'projection', metadata });
    return this;
  }

  filter(
    // Lazy functional filter
    fn // filtering function
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'filter', fn });
    return this;
  }

  select(
    // Declarative lazy filter
    query // filter expression
    // Return: new Cursor instance
  ) {
    const cursor = new Cursor.MemoryCursor();
    cursor.parents.push(this);
    if (this.schema) cursor.definition(this.schema);
    cursor.jsql.push({ op: 'select', query });
    return cursor;
  }

  distinct(
    // Lazy functional distinct filter
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'distinct' });
    return this;
  }

  find(
    // Lazy functional find (legacy)
    query, // find expression
    options // find options
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'find', query, options });
    return this;
  }

  sort(
    // Lazy functional sort
    fn // compare function
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'sort', fn });
    return this;
  }

  order(
    // Declarative lazy ascending sort
    fields // field name or array of names
    // Return: previous instance from chain
  ) {
    if (typeof fields === 'string') fields = [fields];
    this.jsql.push({ op: 'order', fields });
    return this;
  }

  desc(
    // Declarative lazy descending sort
    fields // field name or array of names
    // Return: previous instance from chain
  ) {
    if (typeof fields === 'string') fields = [fields];
    this.jsql.push({ op: 'desc', fields });
    return this;
  }

  count(
    // Calculate count async
    done // callback on done function(err, count)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  sum(
    // Calculate sum async
    done // callback on done function(err, sum)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  avg(
    // Calculate avg async
    done // callback on done function(err, avg)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  max(
    // Calculate max async
    done // callback on done function(err, max)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  min(
    // Calculate min async
    done // callback on done function(err, min)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  median(
    // Calculate median async
    done // callback on done function(err, median)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  mode(
    // Calculate mode async
    done // callback on done function(err, mode)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  col(
    // Convert first column of dataset to Array
    done // callback on done function(err, mode)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  row(
    // Return first row from dataset
    done // callback on done function(err, mode)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED));
    return this;
  }

  one(
    // Get single first record from dataset
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'one' });
    return this;
  }

  limit(
    // Get first n records from dataset
    count // Number
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'limit', count });
    return this;
  }

  union(
    // Calculate union and put results to this Cursor instance
    cursor // Cursor instance
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'union', cursor });
    this.parents.push(cursor);
    return this;
  }

  intersection(
    // Calculate intersection and put results to this Cursor instance
    cursor // Cursor instance
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'intersection', cursor });
    this.parents.push(cursor);
    return this;
  }

  difference(
    // Calculate difference and put results to this Cursor instance
    cursor // Cursor instance
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'difference', cursor });
    this.parents.push(cursor);
    return this;
  }

  complement(
    // Calculate complement and put results to this Cursor instance
    cursor // Cursor instance
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'complement', cursor });
    this.parents.push(cursor);
    return this;
  }

  fetch(
    // Get results after applying consolidated jsql
    done // callback function(err, dataset, cursor)
    // Return: previous instance from chain
  ) {
    done = common.once(done);
    done(new Error(core.NOT_IMPLEMENTED), null, this);
    return this;
  }
}

module.exports = { Cursor };
