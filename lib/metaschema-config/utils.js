'use strict';

const {
  errors: { SchemaValidationError },
  extractByPath,
  extractDecorator,
} = require('metaschema');

const processFields = (ms, category, fields, source) => {
  const errors = [];
  for (const [key, field] of Object.entries(fields)) {
    if (field.domain) {
      const def = ms.domains.get(field.domain);
      if (!def) {
        errors.push(
          new SchemaValidationError('unresolved', `${source}.${key}`, {
            type: 'domain',
            value: field.domain,
          })
        );
      } else {
        Object.assign(field, { domain: field.domain, definition: def });
      }
    } else if (field.category) {
      const cat = ms.categories.get(field.category);
      if (!cat) {
        errors.push(
          new SchemaValidationError('unresolved', `${source}.${key}`, {
            type: 'category',
            value: field.category,
          })
        );
      } else {
        field.definition = cat.definition;
      }
    } else if (typeof field === 'string') {
      const src = `${source}.${key}`;
      if (!category) {
        errors.push(
          new SchemaValidationError('illegalParamsResolving', src, {
            type: 'publicAction',
          })
        );
        continue;
      }
      try {
        const def = extractByPath(category, field.field, ms, src);
        Object.assign(field, def);
      } catch (error) {
        errors.push(error);
      }
    }
  }

  return errors;
};

const REFERENCE_TYPES = new Set(['Include', 'Many', 'Master', 'Other']);

// Determines type of a reference by its decorator
//   decorator - <string>
// Returns: <string>
const getReferenceType = decorator =>
  REFERENCE_TYPES.has(decorator) ? decorator : 'Other';

const getEntityPath = entity => `${entity.category}.${entity.name}`;

const typeToPlural = {
  form: 'forms',
  action: 'actions',
};

const HIERARCHICAL_RELATIONS = ['Catalog', 'Subsystem', 'Hierarchy', 'Master'];

// Extracts category decorator type, any undecorated category
// will be treated as Local.
//   category - <Object>
// Returns: <string>
const getCategoryType = category => {
  const type = extractDecorator(category);
  return type === 'Object' ? 'Local' : type;
};

module.exports = {
  processFields,
  getReferenceType,
  getEntityPath,
  getCategoryType,
  typeToPlural: type => typeToPlural[type],
  REFERENCE_TYPES,
  HIERARCHICAL_RELATIONS,
};
