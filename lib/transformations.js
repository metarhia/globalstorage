'use strict';

module.exports = (api) => {

  api.gs.transformations = {};

  api.gs.transformations.row = (
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

  api.gs.transformations.col = (
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

  api.gs.transformations.header = (
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

  api.gs.transformations.projection = (
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

  api.gs.transformations.union = (
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

  api.gs.transformations.intersection = (
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

  api.gs.transformations.difference = (
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

  api.gs.transformations.complement = (
    // Set complement
    ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
    ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
    // Result: result array of records, example: [ { id: 3 } ]
  ) => (
     api.gs.transformations.difference(ds2, ds1)
  );

  api.gs.transformations.compare = (record, field, condition) => {
    const operator = condition[0];
    const value = condition[1];
    switch (operator) {
      case '!': return record[field] != value; // eslint-disable-line eqeqeq
      case '=': return record[field] == value; // eslint-disable-line eqeqeq
      case '>': return record[field] > value;
      case '<': return record[field] < value;
      case '>=': return record[field] >= value;
      case '<=': return record[field] <= value;
      case 'in': return record[field] in value;
      case 'not': return !(record[field] in value);
      default: return false;
    }
  };

};
