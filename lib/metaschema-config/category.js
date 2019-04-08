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

const preprocessCategoryData = (type, entity) => {
  const [first, second] = entity.name.split('.');
  if (entity.definition.Public) {
    return first && second
      ? [new SchemaValidationError('ownedPublic', entity.name, { type })]
      : [];
  } else if (!second) {
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
  entity.resources = new Map();
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

const checkDetail = (category, master) =>
  ['Catalog', 'Subsystem', 'Hierarchy']
    .filter(type => category[type.toLowerCase()])
    .map(
      type =>
        new SchemaValidationError('detailHierarchy', category.name, {
          type,
          master: master.name,
        })
    );

const addCategory = category => {
  category.actions = new Map();
  category.forms = new Map();
  category.resources = new Map();

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

    if (type === 'Include') {
      errors.push(...checkDetail(destination, category));
    } else if (type === 'Master') {
      errors.push(...checkDetail(category, destination));
    }

    destination.references[type].push({
      category: category.name,
      property: fieldName,
    });
  }
  return errors;
};

const validateCategory = (ms, category, instance, options) =>
  validate(ms, category.definition, instance, options);

const categoryCreator = (ms, schema, instance) => {
  const result = { ...instance };
  const errors = [];
  for (const [key, value] of Object.entries(instance)) {
    const def = schema.definition[key];
    if (!def) continue;
    try {
      if (def.domain) {
        const { definition } = def;
        if (typeof definition.parse === 'function') {
          result[key] = definition.parse(value);
        }
        continue;
      }
      if (def.category) {
        if (extractDecorator(def) === 'Include') {
          result[key] = ms.create('category', def, value);
        }
      }
    } catch (err) {
      errors.push(err);
    }
  }
  return [errors, result];
};

module.exports = {
  preprocessCategoryData,
  addCategory,
  addCategoryData,
  processRelations,
  validateCategory,
  categoryCreator,
};
