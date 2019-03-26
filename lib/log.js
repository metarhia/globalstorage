'use strict';

const removeSensitiveData = (definition, instance) => {
  const filtered = {};
  for (const name of Object.keys(instance)) {
    const prop = definition[name];
    if (
      !prop ||
      (!prop.sensitive && !(prop.definition && prop.definition.sensitive))
    ) {
      filtered[name] = instance[name];
    }
  }
  return filtered;
};

const prepareForLogging = (provider, record) => {
  const { schema: ms } = provider;
  const { Operation: operation, Category: category } = record;
  if (operation === null) {
    const { Action: action, Response: response } = record;
    const schema = category
      ? ms.categories.get(category).actions.get(action)
      : ms.actions.get(action);
    if (!schema) return;
    if (record.Query) {
      record.Query = removeSensitiveData(schema.definition.Args, record.Query);
    }
    if (
      Array.isArray(response) &&
      Object.prototype.toString.call(response[0]) === '[object Object]' &&
      response[0] !== null
    ) {
      record.Response = [
        removeSensitiveData(schema.definition.Returns, response[0]),
      ];
    }
  } else if (!category) {
    return;
  } else if (operation === 'Read') {
    let schema = ms.categories.get(category);
    if (schema && record.getDetails)
      schema = schema.definition[record.getDetails];
    if (!schema) return;
    if (Array.isArray(record.Response)) {
      record.Response = record.Response.map(record =>
        removeSensitiveData(schema.definition, record)
      );
    } else if (typeof record.Response === 'number') {
      return;
    } else if (record.Response) {
      record.Response = removeSensitiveData(schema.definition, record.Response);
    }
  } else {
    const schema = ms.categories.get(category);
    if (!schema) return;
    const { Query: query, Patch: patch } = record;
    if (query && !query.linkDetails && !query.unlinkDetails) {
      record.Query = removeSensitiveData(schema.definition, query);
    }
    if (patch) {
      record.Patch = removeSensitiveData(schema.definition, patch);
    }
  }
};

module.exports = {
  prepareForLogging,
};
