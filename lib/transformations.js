'use strict';

const row = (
  // Get dataset row
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: [1, 'Marcus']
) => {
  const result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    for (const key in obj) {
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
  return ds.map(record => {
    const row = {};
    fields.forEach(field => {
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
  for (let i = 0; i < l1; i++) {
    const item = ds1[i];
    ids.push(item.id);
    ds.push(item);
  }
  for (let i = 0; i < l2; i++) {
    const item = ds2[i];
    if (!ids.includes(item.id)) {
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
  for (let i = 0; i < l1; i++) {
    const item = ds1[i];
    ids.push(item.id);
  }
  for (let i = 0; i < l2; i++) {
    const item = ds2[i];
    if (ids.includes(item.id)) {
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
  for (let i = 0; i < l2; i++) {
    const item = ds2[i];
    ids.push(item.id);
  }
  for (let i = 0; i < l1; i++) {
    const item = ds1[i];
    if (!ids.includes(item.id)) {
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

const condition = def => {
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
  const len = keys.length;
  for (let i = 0; i < len; i++) {
    const key = keys[i];
    const def = defs[key];
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
