'use strict';

const gs = require('..');
const mongodb = require('mongodb').MongoClient;

const url = 'mongodb://127.0.0.1:27017/globalstorage';
const dbName = url.substr(url.lastIndexOf('/') + 1);

const persons = [
  {
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121
  }, {
    category: 'Person',
    name: 'Victor Glushkov',
    city: 'Rostov on Don',
    born: 1923
  }, {
    category: 'Person',
    name: 'Ibn Arabi',
    city: 'Murcia',
    born: 1165
  }, {
    category: 'Person',
    name: 'Mao Zedong',
    city: 'Shaoshan',
    born: 1893
  }, {
    category: 'Person',
    name: 'Rene Descartes',
    city: 'La Haye en Touraine',
    born: 1596
  }
];

mongodb.connect(url, { useNewUrlParser: true }, (err, client) => {

  api.metatests.test('mongodb connection', test => {
    if (err) return test.throws(err);
    test.end();
  });

  const db = client.db(dbName);
  gs.open({ gs, provider: 'mongodb', client, db }, err => {

    api.metatests.test('globalstorage connection', test => {
      if (err) return test.throws(err);
      test.end();
    });

    api.metatests.test('insertMany', test => {
      persons.map((person, i) => gs.create(person, () => {
        if (i === persons.length - 1) test.end();
      }));
    });

    // insert many

    api.metatests.test('modify from select', test => {
      gs.select({ category: 'Person', name: 'Marcus Aurelius' })
        .modify({ name: 'Marcus' }, () => {
          if (err) return test.throws(err);
          test.end();
        });
    });

    api.metatests.test('select, order, limit, fetch', test => {
      gs.select({ category: 'Person', born: '> 1000' })
        .order('born')
        .limit(3)
        //.projection(['name', 'city', 'born'])
        //.distinct()
        .fetch(err => {
          if (err) return test.throws(err);
          test.end();
        });
    });

    api.metatests.test('delete', test => {
      gs.delete({ category: 'Person' }, err => {
        if (err) return test.throws(err);
        test.end();
        process.exit(0);
      });
    });

    api.metatests.report();
  });
});
