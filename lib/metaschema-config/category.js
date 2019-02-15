'use strict';

const { iter } = require('@metarhia/common');

const {
  errors: { SchemaValidationError },
  extractDecorator,
} = require('metaschema');

const validate = require('./validate');

const {
  typeToPlural,
  getEntityPath,
  getReferenceType,
  getCategoryType,
  REFERENCE_TYPES,
  HIERARCHICAL_RELATIONS,
} = require('./utils');

const preprocessCategoryData = entity => {
  const [first, second] = entity.name.split('.');
  if (!second) {
    entity.category = entity.module;
  } else {
    entity.category = first;
    entity.name = second;
  }
  return [];
};

const addCategoryData = (type, entity, ms) => {
  const errors = [];
  const prop = typeToPlural(type);
  const category = ms.categories.get(entity.category);
  if (!entity.category) {
    errors.push(
      new SchemaValidationError('unlinked', getEntityPath(entity), { type })
    );
  } else if (!category) {
    errors.push(
      new SchemaValidationError('unresolved', getEntityPath(entity), {
        type: 'category',
        value: entity.category,
      })
    );
  } else if (category[prop].has(entity.name)) {
    errors.push(
      new SchemaValidationError('duplicate', entity.category, {
        type,
        value: entity.name,
      })
    );
  } else {
    category[prop].set(entity.name, entity);
  }

  return errors;
};

const addCategory = category => {
  category.actions = new Map();
  category.forms = new Map();

  category.references = iter(REFERENCE_TYPES).reduce((references, type) => {
    references[type] = [];
    return references;
  }, {});

  const errors = [];

  Object.entries(category.definition).forEach(([key, value]) => {
    const decorator = extractDecorator(value);

    if (decorator === 'Hierarchy' && !value.category) {
      value.category = category.name;
    }

    for (const decor of HIERARCHICAL_RELATIONS) {
      if (decorator === decor) {
        const property = decorator.toLowerCase();
        if (category[property]) {
          errors.push(
            new SchemaValidationError('duplicate', `${category.name}.${key}`, {
              type: 'hierarchical relation',
              value: decor,
            })
          );
        } else {
          category[property] = key;
        }
      }
    }
  });

  return errors;
};

// Verifies that there could be link from source category to destination
//   source - <Object>
//   destination - <Object>
//   propertyName - <string>
// Returns: <SchemaValidationError> | <null> information about error or null
//   if link is valid
const verifyLink = (source, destination, propertyName) => {
  const sourceType = getCategoryType(source.definition);
  const destinationType = getCategoryType(destination.definition);

  if (
    destinationType === 'Log' ||
    (destinationType === 'Local' && sourceType !== 'Local')
  ) {
    return new SchemaValidationError(
      'illegalLink',
      `${source.name}.${propertyName}`,
      {
        sourceType,
        destination: destination.name,
        destinationType,
      }
    );
  }

  return null;
};

const processRelations = (category, ms) => {
  const errors = [];
  for (const [fieldName, field] of Object.entries(category.definition)) {
    if (!field.category) {
      continue;
    }

    const destination = ms.categories.get(field.category);
    if (!destination) {
      continue;
    }

    const error = verifyLink(category, destination, fieldName);
    if (error) {
      errors.push(error);
      continue;
    }

    const decorator = extractDecorator(field);
    const type = getReferenceType(decorator);
    destination.references[type].push({
      category: category.name,
      property: fieldName,
    });
  }
  return errors;
};

const validateCategory = (ms, category, instance, options) =>
  validate(ms, category.definition, instance, options);

module.exports = {
  preprocessCategoryData,
  addCategory,
  addCategoryData,
  processRelations,
  validateCategory,
};
