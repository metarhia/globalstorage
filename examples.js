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

var mc1 = new gs.MemoryCursor(ds1);
var mc2 = mc1.clone();

mc1.dataset[0].name = 'qwerty';
console.dir(mc1.dataset);
console.dir(mc2.dataset);

/*
gs.open({
  gs: gs,
  provider: 'mongodb',
  connection: connection
}, function(err) {
  if (err) console.dir(err);
});
*/
