'use strict';

const gs = require('..');
const metasync = require('metasync');
const metatests = require('metatests');

module.exports = (data, done) => {
  metatests.test('fs test', (test) => {
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
      if (err) return test.error(err, 'error opening gs');
      console.time('insert');
      let i;
      for (i = 0; i < 10; i++) {
        queue.add({ num: i });
      }
      gs.select({ category: 'Person', name: 'Marcus' })
        .limit(10)
        .fetch((err, data) => {
          console.log(err);
          if (err) return test.throws(err, 'error fetching Marcus');
          test.strictSame([err, data], [null, []]);
          test.end('select test end');
        });
    });

    queue.timeout(1000, () => {
      test.notOk('Insert test error, file writing timeout');
    });

    queue.drain(() => {
      console.timeEnd('insert');
      test.end('insert test done');
      done();
    });
  });
};
