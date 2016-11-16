'use strict';

var gs = require('./globalstorage.js');
var transformations = require('./transformations.js');

var ds1 = [{id:1},{id:2}],
    ds2 = [{id:2},{id:3}];

console.dir({
  union: transformations.union(ds1,ds2),
  intersection: transformations.intersection(ds1,ds2),
  difference: transformations.difference(ds1,ds2),
  complement: transformations.complement(ds1,ds2)
});

/*
gs.open({
  gs: gs,
  provider: 'mongodb',
  connection: connection
}, function(err) {
  if (err) console.dir(err);
});
*/
