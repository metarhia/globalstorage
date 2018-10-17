'use strict';

const errors = require('./errors');

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
    return new Error(errors.NOT_IMPLEMENTED);
  }

  clone(
    // Clone all dataset objects
    // Return: new Cursor instance
  ) {
    return new Error(errors.NOT_IMPLEMENTED);
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
    return new Error(errors.NOT_IMPLEMENTED);
  }

  from(
    // Synchronous virtualization converts Array to Cursor
    arr // array or iterable
    // Return: new Cursor instance
  ) {
    if (Array.isArray(arr)) {
      return new Error(errors.NOT_IMPLEMENTED);
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
    this.jsql.push({ op: 'select', query });
    return this;
  }

  distinct(
    // Lazy functional distinct filter
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'distinct' });
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
    // Calculate count
    field // string, field to use for count or 'undefined'
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'count', field });
    return this;
  }

  sum(
    // Calculate sum
    field // string, field to use for sum
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'sum', field });
    return this;
  }

  avg(
    // Calculate avg
    field // string, field to use for avg
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'avg', field });
    return this;
  }

  max(
    // Calculate max
    field // string, field to use for max
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'max', field });
    return this;
  }

  min(
    // Calculate min async
    field // string, field to use for min
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'min', field });
    return this;
  }

  col(
    // Convert first column of dataset to Array
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'col' });
    return this;
  }

  row(
    // Return first row from dataset
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'row' });
    return this;
  }

  one(
    // Get single first record from dataset
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'limit', count: 1 });
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

  offset(
    // Offset into the dataset
    offset // Number
    // Return: previous instance from chain
  ) {
    this.jsql.push({ op: 'offset', offset });
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

  selectToMemory(query) {
    return new Cursor.MemoryCursor([], {
      jsql: query ? [{ op: 'select', query }] : [],
      schema: this.schema,
      parents: [this],
    });
  }

  // Continue computations via i.e. MemoryCursor or other cursor
  // to handle remaining operations unsupported by current cursor
  //   data - array of rows to date
  //   callback - function(err, dataset, cursor) to be called upon completion
  continue(data, callback) {
    new Cursor.MemoryCursor(data, {
      parents: this.parents,
      category: this.category,
      schema: this.schema,
      jsql: this.jsql,
    }).fetch(callback);
  }

  // Get results after applying consolidated jsql
  //   callback - function(err, dataset, cursor)
  // Return: this instance
  fetch(/* callback */) {
    throw new Error(errors.NOT_IMPLEMENTED);
  }
}

module.exports = { Cursor };
