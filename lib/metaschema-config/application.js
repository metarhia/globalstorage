'use strict';

const {
  errors: { SchemaValidationError },
} = require('metaschema');

const addApplication = (application, ms) => {
  if (ms.applications.has(application.name)) {
    return [
      new SchemaValidationError('duplicate', application.name, {
        type: 'application',
      }),
    ];
  }
  ms.applications.set(application.name, application);
  return [];
};

const processApplication = (application, ms) => {
  const errors = [];
  for (const category of application.definition.Categories) {
    if (!ms.categories.has(category)) {
      errors.push(
        new SchemaValidationError('unresolved', application.name, {
          type: 'category',
          value: category,
        })
      );
    }
  }
  return errors;
};

module.exports = {
  addApplication,
  processApplication,
};
