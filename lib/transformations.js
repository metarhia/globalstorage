'use strict';

// Get dataset row
//   ds - <Object[]>
// Returns: <Array>
//
// Example: row([ { Id: 1, Name: 'Marcus' } ])
// Result: [1, 'Marcus']
const row = ds => {
  const result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    for (const key in obj) {
      result.push(obj[key]);
    }
  }
  return result;
};

// Get dataset column
// Signature: ds[, field]
//   ds - <Object[]>
//   field - <string>, field name, optional
// Returns: <Array>
//
// Example: col([ { Id: 1 }, { Id: 2 }, { Id: 3 } ])
// Result: [1, 2, 3]
const col = (ds, field) => {
  let result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    field = field || Object.keys(ds[0])[0];
    result = ds.map(record => record[field]);
  }
  return result;
};

// Get dataset header
//   ds - <Object[]>
// Returns: <string[]>
//
// Example: header([ { Id: 1, Name: 'Marcus' } ])
// Result: ['Id', 'Name']
const header = ds => {
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    return Object.keys(obj);
  } else {
    return [];
  }
};

// Dataset projection
//   meta - <string[]> | <Object>, projection metadata array of
//       field names or object with structure:
//       { toKey: [ fromKey, funcs ] }
//   ds - <Object[]>
// Returns: <Object[]>
//
// Example: projection({ toKey: [ fromKey, funcs ] },
//     [ { Id: 1, Name: 'Marcus' } ]);
//
// Example: projection(['Name'], [ { Id: 1, Name: 'Marcus' } ]);
//
// Result: [ { Name: 'Marcus' } ]
const projection = (meta, ds) => {
  const complex = !Array.isArray(meta);
  const fields = complex ? Object.keys(meta) : meta;
  return ds.map(record => {
    const row = {};
    fields.forEach(key => {
      if (complex) {
        const data = meta[key];
        const fromKey = data[0];
        const value = record[fromKey];
        if (value !== undefined) {
          row[key] = data.slice(1).reduce((acc, fn) => fn(acc), value);
        }
      } else {
        const value = record[key];
        if (value !== undefined) row[key] = record[key];
      }
    });
    return row;
  });
};

// Set union
//   ds1 - <Object[]>
//   ds2 - <Object[]>
// Returns: <Object[]>
//
// Example: union([ { Id: 1 }, { Id: 2 } ], [ { Id: 2 }, { Id: 3 } ]);
// Result: [ { Id: 1 }, { Id: 2 }, { Id: 3 } ]
const union = (ds1, ds2) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  for (let i = 0; i < l1; i++) {
    const item = ds1[i];
    ids.push(item.Id);
    ds.push(item);
  }
  for (let i = 0; i < l2; i++) {
    const item = ds2[i];
    if (!ids.includes(item.Id)) {
      ids.push(item.Id);
      ds.push(item);
    }
  }
  return ds;
};

// Set intersection
//   ds1 - <Object[]>
//   ds2 - <Object[]>
// Returns: <Object[]>
//
// Example: intersection([ { Id: 1 }, { Id: 2 } ], [ { Id: 2 }, { Id: 3 } ]);
// Result: [ { Id: 2 } ]
const intersection = (ds1, ds2) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  for (let i = 0; i < l1; i++) {
    const item = ds1[i];
    ids.push(item.Id);
  }
  for (let i = 0; i < l2; i++) {
    const item = ds2[i];
    if (ids.includes(item.Id)) {
      ds.push(item);
    }
  }
  return ds;
};

// Set difference
//   ds1 - <Object[]>
//   ds2 - <Object[]>
// Returns: <Object[]>
//
// Example: difference([ { Id: 1 }, { Id: 2 } ], [ { Id: 2 }, { Id: 3 } ]);
// Result: [ { Id: 1 } ]
const difference = (ds1, ds2) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  for (let i = 0; i < l2; i++) {
    const item = ds2[i];
    ids.push(item.Id);
  }
  for (let i = 0; i < l1; i++) {
    const item = ds1[i];
    if (!ids.includes(item.Id)) {
      ds.push(item);
    }
  }
  return ds;
};

// Set complement
//   ds1 - <Object[]>
//   ds2 - <Object[]>
// Returns: <Object[]>
//
// Example: complement([ { Id: 1 }, { Id: 2 } ], [ { Id: 2 }, { Id: 3 } ]);
// Result: [ { Id: 3 } ]
const complement = (ds1, ds2) => difference(ds2, ds1);

const compare = (value, op, data) => {
  if (op === '=') return value === data;
  if (op === '<') return value < data;
  if (op === '>') return value > data;
  if (op === '<=') return value <= data;
  if (op === '>=') return value >= data;
  return false;
};

const condition = def => {
  if (typeof def !== 'string') {
    return ['=', def];
  }
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
  constraints,
};
