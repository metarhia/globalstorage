'use strict';

const transformations = require('./transformations');

const constraints = defs => transformations.constraints(defs, def => {
  const c0 = def[0];
  const eq = c0 === '=';
  const nt = c0 === '!';
  if (eq || nt) {
    const val = def.substr(1).trim();
    const value = parseFloat(val) || val;
    if (eq) return value;
    if (nt) return { $ne: value };
  }
  const c1 = def[1];
  const et = c1 === '=';
  const lt = c0 === '<';
  const gt = c0 === '>';
  if (lt || gt) {
    if (et) {
      const val = def.substr(2).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lte: value };
      else return { $gte: value };
    } else {
      const val = def.substr(1).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lt: value };
      else return { $gt: value };
    }
  }
  return def;
});

const fieldsToHash = list => {
  const fields = {};
  list.forEach(field => fields[field] = 1);
  return fields;
};

module.exports = { constraints, fieldsToHash };
