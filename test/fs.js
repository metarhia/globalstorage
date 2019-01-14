'use strict';

const gs = require('..');
const metasync = require('metasync');
const metatests = require('metatests');

module.exports = (data, done) => {
  metatests.test('fs test', test => {
    const queue = metasync.queue(100, 100);

    const processItem = (item, callback) => {
      gs.create(item, () => {
        item.Name = item.Id % 2 ? 'Marcus' : 'Aurelius';
        gs.update(item, () => {
          if (item.Id % 3) {
            gs.delete(item.Id, callback);
          } else {
            callback();
          }
        });
      });
    };

    queue.process(processItem);

    gs.open(
      {
        gs,
        provider: 'fs',
        path: './data',
      },
      err => {
        if (err) {
          test.error(err, 'error opening gs');
          return;
        }
        console.time('insert');
        for (let i = 0; i < 10; i++) {
          queue.add({ Num: i });
        }
        gs.select({ category: 'Person', Name: 'Marcus' })
          .limit(10)
          .fetch((err, data) => {
            console.log(err);
            if (err) {
              test.throws(err, 'error fetching Marcus');
              return;
            }
            test.strictSame([err, data], [null, []]);
            test.end('select test end');
          });
      }
    );

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
