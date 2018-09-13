'use strict';

const metaschema = require('metaschema');

metaschema.load('schemas/system', (err, schema) => {
  if (err) throw err;
  metaschema.build(schema);
});
