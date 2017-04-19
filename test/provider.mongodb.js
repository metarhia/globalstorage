'use strict';

module.exports = (api) => {

  const gs = api.gs;
  api.mongodb = require('mongodb').MongoClient;

  const url = 'mongodb://127.0.0.1:27017/globalstorage';
  api.mongodb.connect(url, (err, connection) => {

    gs.open({
      gs, provider: 'mongodb', connection
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

};
