'use strict';

var transformations = {};
module.exports = transformations;

// Get dataset row
//   ds - array of records, example: [{id:1,name:'Marcus'}]
//   result - result array of records, example: [1,'Marcus']
//
transformations.row = function(ds) {
  var result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    var obj = ds[0];
    for (var key in obj) {
      result.push(obj[key]);
    }
  }
  return result;
};

// Get dataset column
//   ds - array of records, example: [{id:1},{id:2},{id:3}]
//   result - result array of records, example: [1,2,3]
//
transformations.col = function(ds) {
  var result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    var key = Object.keys(ds[0])[0];
    result = ds.map(function(record) {
      return record[key];
    });
  }
  return result;
};

// Get dataset header
//   ds - array of records, example: [{id:1,name:'Marcus'}]
//   result - result array of records, example: ['id','name']
//
transformations.header = function(ds) {
  if (Array.isArray(ds) && ds.length > 0) {
    var obj = ds[0];
    return Object.keys(obj);
  } else {
    return [];
  }
};

// Dataset projection
//   meta - projection metadata, example: ['name']
//   ds - array of records, example: [{id:1,name:'Marcus'}]
//   result - result array of records, example: [{name:'Marcus'}]
//
transformations.projection = function(meta, ds) {
  var fields = meta;
  return ds.map(function(record) {
    var row = {};
    fields.forEach(function(field) {
      row[field] = record[field];
    });
    return row;
  });
};

// Set union
//   ds1 - array of records #1, example: [{id:1},{id:2}]
//   ds2 - array of records #2, example: [{id:2},{id:3}]
//   result - result array of records, example: [{id:1},{id:2},{id:3}]
//
transformations.union = function(ds1, ds2) {
  var ds = [], ids = [],
      i, item,
      l1 = ds1.length, l2 = ds2.length;
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

// Set intersection
//   ds1 - array of records #1, example: [{id:1},{id:2}]
//   ds2 - array of records #2, example: [{id:2},{id:3}]
//   result - result array of records, example: [{id:2}]
//
transformations.intersection = function(ds1, ds2) {
  var ds = [], ids = [],
      i, item,
      l1 = ds1.length, l2 = ds2.length;
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

// Set difference
//   ds1 - array of records #1, example: [{id:1},{id:2}]
//   ds2 - array of records #2, example: [{id:2},{id:3}]
//   result - result array of records, example: [{id:1}]
//
transformations.difference = function(ds1, ds2) {
  var ds = [], ids = [],
      i, item,
      l1 = ds1.length, l2 = ds2.length;
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

// Set complement
//   ds1 - array of records #1, example: [{id:1},{id:2}]
//   ds2 - array of records #2, example: [{id:2},{id:3}]
//   result - result array of records, example: [{id:3}]
//
transformations.complement = function(ds1, ds2) {
  return transformations.difference(ds2, ds1);
};

// Copy dataset (copy objects to new array)
//
transformations.copy = function(ds) {
  return ds.slice();
  /* TODO: test speed in following implementations:
  1. slice() and slice(0)
  2. [].concat(arr);
  3. following solution:
  var result = [],
      l1 = ds.length;
  for (i = 0; i < l1; i++) {
    result.push(ds[i]);
  }
  return result;
  */
};

// Clone dataset (clone objects to new array)
//
transformations.clone = function(ds) {
  return cloneArray(ds);
};

function cloneObject(obj) {
  var result = {},
      keys = Object.keys(obj),
      i, key, val, type,
      len = keys.length;
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
  var result = [],
      i, val, type,
      len = arr.length;
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
