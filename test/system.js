'use strict';

const metaschema = require('metaschema');

metaschema.fs.loadAndCreate('schemas/system', null, err => {
  if (err) throw err;
});
