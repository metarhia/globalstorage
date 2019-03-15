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
    const { Action: action } = record;
    const schema = category
      ? ms.categories.get(category).actions.get(action)
      : ms.actions.get(action);
    if (record.Query) {
      record.Query = removeSensitiveData(schema.definition.Args, record.Query);
    }
    if (Array.isArray(record.Response) && record.Response[0]) {
      record.Response = [
        removeSensitiveData(schema.definition.Returns, record.Response[0]),
      ];
    }
  } else if (!category) {
    return;
  } else if (operation === 'Read') {
    let schema = ms.categories.get(category);
    if (record.getDetails) schema = schema.definition[record.getDetails];
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
