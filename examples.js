'use strict';

var gs = require('./globalstorage.js');

gs.open({
  gs: gs,
  provider: 'mongodb',
  connection: connection
}, function(err) {
  if (err) console.dir(err);
});
