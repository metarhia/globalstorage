'use strict';

module.exports = (api) => {

  const gs = api.gs;
  api.mongodb = require('mongodb').MongoClient;

  const url = 'mongodb://127.0.0.1:27017/globalstorage';
  const dbName = url.substr(url.lastIndexOf('/') + 1);

  api.mongodb.connect(url, (err, client) => {

    const db = client.db(dbName);

    gs.open({ gs, provider: 'mongodb', client, db }, (err) => {

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
          .fetch((err, records) => {
            console.dir({ records });
            gs.delete({ category: 'Person' }, () => {
              end();
            });
          });

      });

    });

    let count = 0;
    function end() {
      if (++count === 2) client.close();
    }

  });

};
