'use strict';

const { iter } = require('@metarhia/common');
const { extractDecorator } = require('metaschema');

const {
  serializeDecorated,
  stringifyGroup,
} = require('./decorators-serialization');

const serialize = (
  type,
  definition,
  { exclude = () => false, replace = () => null } = {}
) =>
  iter(Object.entries(definition))
    .filter(([name, ins]) => !exclude(name, ins))
    .map(([name, ins]) => {
      const decName = extractDecorator(ins);
      const serialized =
        replace(name, ins) || serializeDecorated(type, decName, ins);
      return `${name}:${serialized}`;
    })
    .join(',', '{', '}');

const wrapDecorator = (decName, source) =>
  decName === 'Object' ? source : `${decName}(${source})`;

const serializeDomains = (definition, config) =>
  serialize('domains', definition, config);

const serializeCategory = (definition, config) =>
  wrapDecorator(
    extractDecorator(definition),
    serialize('category', definition, config)
  );

const serializeAction = (definition, config) => {
  const serializationFields = new Set(['Args', 'Returns']);

  const replaced = { Execute: 'async()=>{}' };
  const replacedFields = Object.keys(replaced);

  return wrapDecorator(
    'Action',
    iter(Object.entries(definition))
      .map(([name, ins]) => {
        let source;
        if (serializationFields.has(name)) {
          source = serialize('category', ins, config);
        } else if (replacedFields.includes(name)) {
          source = replaced[name];
        } else {
          source = ins;
        }

        return `${name}:${source}`;
      })
      .join(',', '{', '}')
  );
};

const serializeApplication = definition => {
  return wrapDecorator(
    'Application',
    serialize('application', definition, {
      replace: (name, ins) => stringifyGroup(ins),
    })
  );
};

const serializers = {
  action: serializeAction,
  domains: serializeDomains,
  category: serializeCategory,
  application: serializeApplication,
};

// Serializes schemas
//   schema - <Object>
//   config - <Object>,
//     exclude - <Function>,
//     replace - <Function> | <Object>
//
// Returns: <Object>, schema with new source
const serializeSchema = (schema, config) => {
  const { definition, ...result } = schema;
  const type = schema.type;

  result.source = serializers[type](definition, config);

  return result;
};

module.exports = { serializeSchema };
