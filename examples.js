'use strict';

var gs = require('./globalstorage.js');
var metasync = require('metasync');

var ds1 = [{id:1},{id:2}],
    ds2 = [{id:2},{id:3}];

console.dir({
  union: gs.transformations.union(ds1,ds2),
  intersection: gs.transformations.intersection(ds1,ds2),
  difference: gs.transformations.difference(ds1,ds2),
  complement: gs.transformations.complement(ds1,ds2)
});

var mc1 = new gs.MemoryCursor(ds1);
var mc2 = mc1.clone();

mc1.dataset[0].name = 'qwerty';
console.dir(mc1.dataset);
console.dir(mc2.dataset);

gs.open({
  gs: gs,
  provider: 'fs',
  path: './data'
}, function(err) {
  if (err) console.dir(err);
  else {
    console.time('insert');
    for (var i = 0; i < 10000; i++) {
      queue.add({ id: i });
    }
  }
});

var queue =  new metasync.ConcurrentQueue(2000, 2000);

queue.on('process', gs.create);

//function(item, callback) {
/*  gs.create(item, function() {
    callback();
  });
});*/

queue.on('timeout', function() {
  console.log('Insert test error, file writing timeout');
});

queue.on('empty', function() {
  console.timeEnd('insert');
  console.log('Insert test done');
});
