'use strict';

var gs = require('./globalstorage.js');
var metasync = require('metasync');
var mongodb = require('mongodb').MongoClient;

memoryProviderTest();
//fsProviderTest();
mongodbProviderTest();

// Memory
//
function memoryProviderTest() {

  var ds1 = [ {id: 1}, {id: 2} ];
  var ds2 = [ {id: 2}, {id: 3} ];

  console.dir({
    union: gs.transformations.union(ds1, ds2),
    intersection: gs.transformations.intersection(ds1, ds2),
    difference: gs.transformations.difference(ds1, ds2),
    complement: gs.transformations.complement(ds1, ds2)
  });

  var mc1 = new gs.MemoryCursor(null, ds1);
  var mc2 = mc1.clone();

  mc1.dataset[0].name = 'qwerty';
  console.dir(mc1.dataset);
  console.dir(mc2.dataset);

}

// Filesystem
//
function fsProviderTest() {

  gs.open({
    gs: gs,
    provider: 'fs',
    path: './data'
  }, function(err) {
    if (err) console.dir(err);
    else {
      console.time('insert');
      for (var i = 0; i < 100; i++) {
        queue.add({ num: i });
      }
    }
  });

  var queue =  new metasync.ConcurrentQueue(2000, 2000);
  queue.on('process', processItem);

  function processItem(item, callback) {
    gs.create(item, function() {
      item.name = item.id % 2 ? 'Marcus' : 'Aurelius';
      gs.update(item, function() {
        if (item.id % 3) {
          gs.delete(item.id, callback);
        } else {
          callback();
        }
      });
    });
  }

  queue.on('timeout', function() {
    console.log('Insert test error, file writing timeout');
  });

  queue.on('empty', function() {
    console.timeEnd('insert');
    console.log('Insert test done');
  });

}

// Mongodb
//
function mongodbProviderTest() {

  var url = 'mongodb://127.0.0.1:27017/globalstorage';
  mongodb.connect(url, function(err, connection) {
    gs.open({
      gs: gs,
      provider: 'mongodb',
      connection: connection
    }, function(err) {
      console.log('opened');
      if (err) console.dir(err);
      gs
      .create({ category: 'Person', name: 'Marcus' }, function() {
        gs
        .select({ category: 'Person', name: 'Marcus' })
        .modify({ name: 'Aurelius' }, function() {
          gs
          .select({ category: 'Person' })
          .limit(3)
          .desc(['id'])
          .projection(['id', 'name'])
          .toArray(function(err, data) {
            console.dir([err, data]);
            connection.close();
          });
        });
      });
    });
  });

}
