'use strict';

const gs = require('..');
const metasync = require('metasync');

const queue = metasync.queue(100, 100);

const processItem = (item, callback) => {
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
};

queue.process(processItem);

gs.open({
  gs,
  provider: 'fs',
  path: './data'
}, (err) => {
  if (err) return console.dir(err);
  console.time('insert');
  let i;
  for (i = 0; i < 10; i++) {
    queue.add({ num: i });
  }
  gs.select({ category: 'Person', name: 'Marcus' })
    .limit(10)
    .fetch((err, data) => {
      console.log('Select test: ');
      console.dir([err, data]);
    });
});

queue.timeout(1000, () => {
  console.log('Insert test error, file writing timeout');
});

queue.drain(() => {
  console.timeEnd('insert');
  console.log('Insert test done');
});
