'use strict';

const gs = require('..');
const metasync = require('metasync');
const mongodb = require('mongodb').MongoClient;
const metatests = require('metatests');

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

const insertMany = (data, done) => {
  persons.map((person, i) => gs.create(person, () => {
    if (i === persons.length - 1) {
      done();
    }
  }));
};

const modifyQuery = (data, done) => {
  gs.select({ category: 'Person', name: 'Marcus Aurelius' })
    .modify({ name: 'Marcus' }, done);
};

const queryCursor = (data, done) => {
  gs.select({ category: 'Person', born: '> 1000' })
    .order('born')
    .limit(3)
    //.projection(['name', 'city', 'born'])
    //.distinct()
    .fetch((err) => done(err));
};

const deletePersons = (data, done) => {
  gs.delete({ category: 'Person' }, done);
};

module.exports = (data, done) => {
  mongodb.connect(url, (err, client) => {
    const db = client.db(dbName);
    metatests.test('mongodb test', (test) => {
      gs.open({ gs, provider: 'mongodb', client, db }, (err) => {
        if (err) return test.throws(err, 'error opening');

        metasync(
          [insertMany, modifyQuery, queryCursor, deletePersons]
        )({}, (err) => {
          if (err) test.throws(err);
          else test.end('bye');
          done();
        });
      });
    });
  });
};
