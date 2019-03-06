'use strict';

const {
  errors: { SchemaValidationError },
} = require('metaschema');

const { typeToPlural } = require('./utils');

const preprocessResources = resources => {
  const parts = resources.name.split('.');
  if (parts.length === 1) {
    resources.locale = parts[0];
    resources.category = resources.module;
  } else if (parts.length === 2) {
    [resources.category, resources.locale] = parts;
  } else if (parts.length === 3) {
    [resources.entityName, resources.entityType, resources.locale] = parts;
  } else {
    [
      resources.category,
      resources.entityName,
      resources.entityType,
      resources.locale,
    ] = parts;
  }
  return [];
};

const addResources = (
  { name, locale, category, definition, entityName, entityType },
  ms
) => {
  if (category === 'common') {
    if (ms.resources.common.has(locale)) {
      return [
        new SchemaValidationError('duplicate', name, {
          type: 'resources',
          value: locale,
        }),
      ];
    }
    ms.resources.common.set(locale, JSON.stringify(definition));
  } else if (category === 'domains') {
    const location = ms.resources.domains;
    if (!location.has(locale)) {
      location.set(locale, JSON.stringify(definition));
    } else {
      const errors = [];
      const obj = JSON.parse(location.get(locale));
      for (const [key, localization] of Object.entries(definition)) {
        if (obj[key]) {
          errors.push(
            new SchemaValidationError('duplicate', name, {
              type: 'domain localization',
              value: key,
            })
          );
        } else {
          obj[key] = localization;
        }
      }
      location.set(locale, JSON.stringify(obj));
      return errors;
    }
  } else {
    const cat = ms.categories.get(category);
    let location;
    if (!entityType) {
      location = cat;
    } else if (entityType === 'action' && ms.actions.has(entityName)) {
      location = ms.actions.get(entityName);
    } else if (cat) {
      location = cat[typeToPlural(entityType)].get(entityName);
    }

    if (!location) {
      return [
        new SchemaValidationError('unresolved', name, {
          type: entityType || 'category',
          value: entityName || category,
        }),
      ];
    }

    if (location.resources.has(locale)) {
      return [
        new SchemaValidationError('duplicate', name, {
          type: 'resources',
          value: locale,
        }),
      ];
    }
    location.resources.set(locale, JSON.stringify(definition));
  }
  return [];
};

module.exports = {
  preprocessResources,
  addResources,
};
