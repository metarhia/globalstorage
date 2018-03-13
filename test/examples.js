'use strict';

const gs = require('..');
const metasync = require('metasync');
const mongodb = require('mongodb').MongoClient;

memoryProviderTest();
if (!gs) fsProviderTest();
mongodbProviderTest();

function memoryProviderTest() {

  const ds1 = [ { id: 1 }, { id: 2 } ];
  const ds2 = [ { id: 2 }, { id: 3 } ];

  console.dir({
    union: gs.transformations.union(ds1, ds2),
    intersection: gs.transformations.intersection(ds1, ds2),
    difference: gs.transformations.difference(ds1, ds2),
    complement: gs.transformations.complement(ds1, ds2)
  });

  const mc1 = new gs.MemoryCursor(null, ds1);
  const mc2 = mc1.clone();

  mc1.dataset[0].name = 'qwerty';
  console.dir(mc1.dataset);
  console.dir(mc2.dataset);

  const mc3 = mc1.clone().order('id');
  console.dir({ mc3: mc3.dataset });

  const mc4 = mc1.clone().desc(['id', 'name']);
  console.dir({ mc4: mc4.dataset });

  const persons = [
    { name: 'Marcus Aurelius', city: 'Rome', born: 121 },
    { name: 'Victor Glushkov', city: 'Rostov on Don', born: 1923 },
    { name: 'Ibn Arabi', city: 'Murcia', born: 1165 },
    { name: 'Mao Zedong', city: 'Shaoshan', born: 1893 },
    { name: 'Rene Descartes', city: 'La Haye en Touraine', born: 1596 }
  ];

  const mcPersons = new gs.MemoryCursor(null, persons);
  mcPersons.select({ born: ['<', 1500] }).order('born');
  console.dir({ mcPersons: mcPersons.dataset });

}

function fsProviderTest() {

  const queue = new metasync.ConcurrentQueue(2000, 2000);
  queue.on('process', processItem);

  gs.open({
    gs,
    provider: 'fs',
    path: './data'
  }, (err) => {
    if (err) return console.dir(err);
    console.time('insert');
    let i;
    for (i = 0; i < 100; i++) {
      queue.add({ num: i });
    }
    gs.select({ category: 'Person', name: 'Marcus' })
      .limit(10)
      .fetch((err, data) => {
        console.log('Select test: ');
        console.dir([err, data]);
      });
  });

  function processItem(item, callback) {
    gs.create(item, () => {
      item.name = item.id % 2 ? 'Marcus' : 'Aurelius';
      gs.update(item, () => {
        if (item.id % 3) {
          gs.delete(item.id, callback);
        } else {
          callback();
        }
      });
    });
  }

  queue.on('timeout', () => {
    console.log('Insert test error, file writing timeout');
  });

  queue.on('empty', () => {
    console.timeEnd('insert');
    console.log('Insert test done');
  });

}

function mongodbProviderTest() {

  const url = 'mongodb://127.0.0.1:27017/globalstorage';
  mongodb.connect(url, (err, connection) => {
    gs.open({
      gs,
      provider: 'mongodb',
      connection
    }, (err) => {
      console.log('opened');
      if (err) console.dir(err);

      gs.create({ category: 'Person', name: 'Marcus' }, () => {
        gs.select({ category: 'Person', name: 'Marcus' })
          .modify({ name: 'Aurelius' }, () => {
            gs.select({ category: 'Person' })
              .limit(3)
              .desc(['id'])
              .projection(['id', 'name'])
              .distinct()
              .fetch((err, data) => {
                console.dir([err, data]);
                end();
              });
          });

        gs.select({ category: 'Person', name: 'Aurelius' })
          .next((err, record) => {
            console.dir({ record });
            end();
          });

      });

    });

    let count = 0;
    function end() {
      if (++count === 2) connection.close();
    }

  });

}
