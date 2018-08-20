'use strict';

const metaschema = require('metaschema');

metaschema.load('schemas/system', (err, schema) => {
  if (err) throw err;
  metaschema.build(schema);

  for (const schema of metaschema.categories.values()) {
    console.log('Category: ' + schema.name);
    const { definition } = metaschema.categories.get(schema.name);
    for (const name in definition) {
      const field = definition[name];
      console.log('  Field: ' + name);
      const decorator = field.constructor.name;
      if (decorator !== 'Object') {
        console.log('    Decorator: ' + decorator);
        console.log('    Definition: ' + JSON.stringify(field));
      }
    }
    console.log();
  }

});
