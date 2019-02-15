'use strict';

const {
  default: { config },
  errors: { SchemaValidationError },
  extractDecorator,
} = require('metaschema');

const { decorators, localDecorators } = require('./decorators');

const {
  preprocessCategoryData,
  addCategory,
  processRelations,
  validateCategory,
} = require('./category');

const { processForm, addForm, validateForm } = require('./form');

const { addAction, processAction, validateAction } = require('./action');

const { typeToPlural } = require('./utils');

SchemaValidationError.serializers.unlinked = ({ source, info: { type } }) =>
  `Unlinked ${type} '${source}'`;

SchemaValidationError.serializers.illegalLink = ({
  source,
  info: { sourceType, destination, destinationType },
}) =>
  `Illegal link from ${sourceType} '${source}' ` +
  `to ${destinationType} '${destination}`;

const preprocessor = schemas => {
  const arr = [...schemas];

  for (const schema of schemas) {
    if (schema.type !== 'category') {
      continue;
    }
    Object.entries(schema.definition).forEach(([key, value]) => {
      const decorator = extractDecorator(value);
      if (decorator === 'Action') {
        delete schema.definition[key];
        arr.push({
          type: 'action',
          name: `${schema.name}.${key}`,
          module: schema.module,
          definition: value,
        });
      }
    });
  }

  return arr;
};

module.exports = {
  options: {
    decorators,
    localDecorators,
    pathToType: {
      domains: 'domains',
      category: 'category',
      action: 'action',
      form: 'form',
    },
    preprocessor,
  },
  config: {
    prepare: ms => {
      ms.categories = new Map();
      ms.domains = new Map();
    },
    resolve: (ms, type, name) => {
      if (type === 'domains') {
        return ms.domains.get(name);
      } else if (type === 'category') {
        return ms.categories.get(name);
      } else {
        return ms.categories
          .get(name.category)
          [typeToPlural(type)].get(name.entity);
      }
    },
    processors: {
      domains: config.processors.domains,
      category: {
        add: [...config.processors.category.add, addCategory],
        postprocess: [
          ...config.processors.category.postprocess,
          processRelations,
        ],
        validateInstance: validateCategory,
      },
      action: {
        preprocess: [preprocessCategoryData],
        add: [addAction],
        postprocess: [processAction],
        validateInstance: validateAction,
      },
      form: {
        preprocess: [preprocessCategoryData],
        add: [addForm],
        postprocess: [processForm],
        validateInstance: validateForm,
      },
    },
    processOrder: {
      domains: 0,
      category: 1,
      form: 2,
      action: 3,
    },
  },
};
