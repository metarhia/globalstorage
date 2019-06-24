'use strict';

const transformations = require('./transformations');

const select = (operation, dataset) => {
  const query = operation.query;
  const constraints = transformations.constraints(query);
  const fields = Object.keys(query);
  const compare = transformations.compare;
  return dataset.filter(record => {
    const len = fields.length;
    for (let i = 0; i < len; i++) {
      const field = fields[i];
      const value = record[field];
      const [op, data] = constraints[field];
      const keep = compare(value, op, data);
      if (!keep) return false;
    }
    return true;
  });
};

const distinct = (operation, dataset) => {
  const keys = new Set();
  let fields = operation.fields;
  if (typeof operation === 'string') fields = [fields];
  return dataset.filter(record => {
    const cols = fields || Object.keys(record).sort();
    const key = cols.map(field => record[field]).join('\x00');
    const has = keys.has(key);
    keys.add(key);
    return !has;
  });
};

const order = (operation, dataset) => {
  let fields = operation.fields;
  if (typeof operation === 'string') fields = [fields];
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
  if (typeof operation === 'string') fields = [fields];
  dataset.sort((r1, r2) => {
    const a1 = fields.map(field => r1[field]).join('\x00');
    const a2 = fields.map(field => r2[field]).join('\x00');
    if (a1 < a2) return 1;
    if (a1 > a2) return -1;
    return 0;
  });
  return dataset;
};

const limit = (operation, dataset) => dataset.slice(0, operation.count);

const offset = (operation, dataset) => dataset.slice(operation.offset);

const count = (operation, dataset) => {
  let length = 0;
  if (!operation.field) {
    length = dataset.length;
  } else {
    dataset.forEach(item => {
      if (Object.prototype.hasOwnProperty.call(item, operation.field)) length++;
    });
  }
  return [length];
};

const projection = (operation, dataset) =>
  transformations.projection(operation.fields, dataset);

const row = (operation, dataset) => transformations.row(dataset);

const col = (operation, dataset) =>
  transformations.col(dataset, operation.field);

const one = (operation, dataset) => dataset[0];

const union = (operation, dataset) =>
  transformations.union(dataset, operation.cursor.dataset);

const intersection = (operation, dataset) =>
  transformations.intersection(dataset, operation.cursor.dataset);

const difference = (operation, dataset) =>
  transformations.difference(dataset, operation.cursor.dataset);

const complement = (operation, dataset) =>
  transformations.complement(dataset, operation.cursor.dataset);

module.exports = {
  select,
  distinct,
  order,
  desc,
  limit,
  offset,
  count,
  projection,
  row,
  col,
  one,
  union,
  intersection,
  difference,
  complement,
};
