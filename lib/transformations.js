'use strict';

const transformations = {};
module.exports = transformations;

transformations.row = (
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

transformations.col = (
  // Get dataset column
  ds // array of records, example: [ { id: 1 }, { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [1, 2, 3]
) => {
  let result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    const key = Object.keys(ds[0])[0];
    result = ds.map(record => record[key]);
  }
  return result;
};

transformations.header = (
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

transformations.projection = (
  // Dataset projection
  meta, // projection metadata, example: ['name']
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: [ { name: 'Marcus' } ]
) => {
  const fields = meta;
  return ds.map((record) => {
    const row = {};
    fields.forEach(field => row[field] = record[field]);
    return row;
  });
};

transformations.union = (
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

transformations.intersection = (
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

transformations.difference = (
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

transformations.complement = (
  // Set complement
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 3 } ]
) => (
   transformations.difference(ds2, ds1)
);

transformations.copy = (
  // Copy dataset (copy objects to new array)
  ds
) => ds.slice();
/* TODO: test speed in following implementations:
  1. slice() and slice(0)
  2. [].concat(arr);
  3. following solution:
  let result = [],
      l1 = ds.length;
  for (i = 0; i < l1; i++) {
    result.push(ds[i]);
  }
  return result;
*/

transformations.clone = (
  // Clone dataset (clone objects to new array)
  ds
) => cloneArray(ds);

function cloneObject(obj) {
  const result = {};
  const keys = Object.keys(obj);
  const len = keys.length;
  let i, key, val, type;
  for (i = 0; i < len; i++) {
    key = keys[i];
    val = obj[key];
    type = typeof(val);
    if (type === 'object') {
      result[key] = (
        Array.isArray(val) ? cloneArray(val) : cloneObject(val)
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

function cloneArray(arr) {
  const result = [];
  const len = arr.length;
  let i, val, type;
  for (i = 0; i < len; i++) {
    val = arr[i];
    type = typeof(val);
    if (type === 'object') {
      result.push(
        Array.isArray(val) ? cloneArray(val) : cloneObject(val)
      );
    } else {
      result.push(val);
    }
  }
  return result;
}
