'use strict';

const gs = require('..');
const metasync = require('metasync');
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

mongodb.connect(url, (err, client) => {
  const db = client.db(dbName);
  gs.open({ gs, provider: 'mongodb', client, db }, (err) => {

    if (err) throw err;
    console.log('opened');

    const insertMany = (data, done) => {
      persons.map((person, i) => gs.create(person, () => {
        //console.dir([person, i]);
        if (i === persons.length - 1) {
          console.log('create done');
          done();
        }
      }));
    };

    const modifyQuery = (data, done) => {
      gs.select({ category: 'Person', name: 'Marcus Aurelius' })
        .modify({ name: 'Marcus' }, (err) => {
          if (err) throw err;
          console.log('modify done');
          done();
        });
    };

    const queryCursor = (data, done) => {
      gs.select({ category: 'Person' }) // born: '> 1000'
        .order('born')
        .limit(3)
        .distinct()
        .fetch((err, data) => {
          if (err) throw err;
          console.dir({ queryCursor: data });
          done();
        });
    };

    const deletePersons = (data, done) => {
      gs.delete({ category: 'Person' }, (err) => {
        if (err) throw err;
        console.log('delete done');
        done();
      });
    };

    metasync(
      [insertMany, modifyQuery, queryCursor, deletePersons]
    )({}, () => {
      console.log('bye');
      process.exit(0);
    });

  });
});
