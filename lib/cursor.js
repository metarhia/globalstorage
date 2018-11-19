'use strict';

const { GSError, codes: errorCodes } = require('./errors');

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
  //   schema - <Metaschema>
  //   category - <string>, schema name
  //
  // Returns: <this>
  definition(schema, category) {
    this.schema = schema;
    this.category = category;
    return this;
  }

  // Copy references to new dataset
  //
  // Returns: <Cursor>, new instance
  copy() {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Clone all dataset objects
  //
  // Returns: <Cursor>, new instance
  clone() {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Apply JSQL commands to dataset
  //   jsql - <Array>, commands array
  //
  // Returns: <this>
  enroll(jsql) {
    this.jsql = this.jsql.concat(jsql);
    return this;
  }

  // Remove all instances from dataset
  //
  // Returns: <this>
  empty() {
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Synchronous virtualization converts Array to Cursor
  //   arr - <Iterable>
  //
  // Returns: <Cursor>, new instance
  from(arr) {  // eslint-disable-line no-unused-vars
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }

  // Lazy map
  // fn - <Function>, map function
  //
  // Returns: <this>
  map(fn) {
    this.jsql.push({ op: 'map', fn });
    return this;
  }

  // Declarative lazy projection
  //   metadata - <string[]> | <Object>, projection metadata array of
  //       field names or object with structure:
  //       { toKey: [ fromKey, functions... ] }
  //
  // Returns: <this>
  projection(metadata) {
    this.jsql.push({ op: 'projection', metadata });
    return this;
  }

  // Lazy functional filter
  //   fn - <Function>, filtering function
  //
  // Returns: <this>
  filter(fn) {
    this.jsql.push({ op: 'filter', fn });
    return this;
  }

  // Declarative lazy filter
  //   query - <Function>, filtering expression
  //
  // Returns: <Cursor>, new instance
  select(query) {
    this.jsql.push({ op: 'select', query });
    return this;
  }

  // Lazy functional distinct filter
  //
  // Returns: <this>
  distinct() {
    this.jsql.push({ op: 'distinct' });
    return this;
  }

  // Lazy functional sort
  //   fn - <Function>, comparing function
  //
  // Returns: <this>
  sort(fn) {
    this.jsql.push({ op: 'sort', fn });
    return this;
  }

  // Declarative lazy ascending sort
  //   fields - <string> | <string[]>
  //
  // Returns: <this>
  order(fields) {
    if (typeof fields === 'string') fields = [fields];
    this.jsql.push({ op: 'order', fields });
    return this;
  }

  // Declarative lazy descending sort
  //   fields - <string> | <string[]>
  //
  // Returns: <this>
  desc(fields) {
    if (typeof fields === 'string') fields = [fields];
    this.jsql.push({ op: 'desc', fields });
    return this;
  }

  // Calculate count
  //   field - <string>, field to use for count, optional
  //
  // Returns: <this>
  count(field) {
    this.jsql.push({ op: 'count', field });
    return this;
  }

  // Calculate sum
  //   field - <string>, field to use for sum
  //
  // Returns: <this>
  sum(field) {
    this.jsql.push({ op: 'sum', field });
    return this;
  }

  // Calculate avg
  //   field - <string>, field to use for avg
  //
  // Returns: <this>
  avg(field) {
    this.jsql.push({ op: 'avg', field });
    return this;
  }

  // Calculate max
  //   field - <string>, field to use for max
  //
  // Returns: <this>
  max(field) {
    this.jsql.push({ op: 'max', field });
    return this;
  }

  // Calculate min
  //   field - <string>, field to use for min
  //
  // Returns: <this>
  min(field) {
    this.jsql.push({ op: 'min', field });
    return this;
  }

  // Convert first column of dataset to Array
  //
  // Returns: <this>
  col() {
    this.jsql.push({ op: 'col' });
    return this;
  }

  // Return first row from dataset
  //
  // Returns: <this>
  row() {
    this.jsql.push({ op: 'row' });
    return this;
  }

  // Get single first record from dataset
  //
  // Returns: <this>
  one() {
    this.jsql.push({ op: 'limit', count: 1 });
    return this;
  }

  // Get first n records from dataset
  //   count - <number>
  //
  // Returns: <this>
  limit(count) {
    this.jsql.push({ op: 'limit', count });
    return this;
  }

  // Offset into the dataset
  //   offset - <number>
  //
  // Returns: <this>
  offset(offset) {
    this.jsql.push({ op: 'offset', offset });
    return this;
  }

  // Calculate union and put results to this Cursor instance
  //   cursor - <Cursor>
  //
  // Returns: <this>
  union(cursor) {
    this.jsql.push({ op: 'union', cursor });
    this.parents.push(cursor);
    return this;
  }

  // Calculate intersection and put results to this Cursor instance
  //   cursor - <Cursor>
  //
  // Returns: <this>
  intersection(cursor) {
    this.jsql.push({ op: 'intersection', cursor });
    this.parents.push(cursor);
    return this;
  }

  // Calculate difference and put results to this Cursor instance
  //   cursor - <Cursor>
  //
  // Returns: <this>
  difference(cursor) {
    this.jsql.push({ op: 'difference', cursor });
    this.parents.push(cursor);
    return this;
  }

  // Calculate complement and put results to this Cursor instance
  //   cursor - <Cursor>
  //
  // Returns: <this>
  complement(cursor) {
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
  //   data - <Array>, rows to date
  //   callback - <Function>, to be called upon completion
  //     err - <Error> | <null>
  //     dataset - <Object[]>
  //     cursor - <MemoryCursor>
  continue(data, callback) {
    new Cursor.MemoryCursor(data, {
      parents: this.parents,
      category: this.category,
      schema: this.schema,
      jsql: this.jsql,
    }).fetch(callback);
  }

  // Get results after applying consolidated jsql
  //   callback - <Function>
  //     err - <Error> | <null>
  //     dataset - <Object[]>
  //     cursor - <MemoryCursor>
  //
  // Returns: <this>
  fetch(callback) { // eslint-disable-line no-unused-vars
    throw new GSError(errorCodes.NOT_IMPLEMENTED);
  }
}

module.exports = { Cursor };
