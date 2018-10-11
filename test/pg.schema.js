'use strict';

const metaschema = require('metaschema');
const metatests = require('metatests');
const { generateDDL } = require('../lib/pg.ddl');
const { iter } = require('metarhia-common');

const getDomains = domainNames => iter(metaschema.domains)
  .filter(([name]) => domainNames.includes(name))
  .collectTo(Map);

metatests.test('Undefined domain', test => {
  const expectedErrorMessage = 'Domain UndefinedDomain referenced from ' +
     'Test.Name is not defined';

  metaschema.load('test/fixtures/undefined-domain', (err, schema) => {
    test.error(err);
    test.throws(
      () => generateDDL(schema, new Map()),
      new Error(expectedErrorMessage)
    );
    test.end();
  });
});

metatests.test('Too many flags', test => {
  const expectedErrorMessage = 'Too many flags in ErrorFlags, ' +
    'must not be bigger than 64';

  metaschema.load('test/fixtures/too-many-flags/', (err, schema) => {
    test.error(err);
    test.throws(
      () => generateDDL(schema, getDomains(['ErrorFlags', 'LongEnum'])),
      new Error(expectedErrorMessage)
    );
    test.end();
  });
});

metatests.test('Incorrect domain definition', test => {
  const expectedErrorMessage = 'Unsupported domain: IncorrectDomainDefinition';

  metaschema.load('test/fixtures/incorrect-domain-definition/',
    (err, schema) => {
      test.error(err);
      test.throws(
        () => generateDDL(schema, getDomains(['IncorrectDomainDefinition'])),
        new Error(expectedErrorMessage)
      );
      test.end();
    });
});

class InvalidLink {
  constructor({ category }) {
    this.category = category;
  }
}

metatests.test('Not supported decorator', test => {
  const expectedErrorMessage = 'InvalidLink decorator is not supported';

  metaschema.load('test/fixtures/not-supported-decorator', (err, schema) => {
    test.error(err);
    schema.Test.InvalidLink = new InvalidLink({ category: 'Config' });
    test.throws(
      () => generateDDL(schema, getDomains(['Days'])),
      new Error(expectedErrorMessage)
    );
    test.end();
  });
});
