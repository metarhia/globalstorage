'use strict';

const isObject = val =>
  Object.prototype.toString.call(val) === '[object Object]' && val !== null;

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
    if (isObject(response)) {
      record.Response = removeSensitiveData(
        schema.definition.Returns,
        response
      );
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
        isObject(record)
          ? removeSensitiveData(schema.definition, record)
          : record
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

const logStatusValues = ['info', 'warning', 'critical'];

class LogStatus {
  constructor(status, value) {
    this.status = status;
    this.value = value;
  }

  static strip(status) {
    if (status instanceof LogStatus) {
      return status.value;
    }
    return status;
  }

  static wrap(status, wrapper) {
    if (status instanceof LogStatus) {
      status.value = wrapper(status.value);
      return status;
    }
    return wrapper(status);
  }

  static apply(status, fn) {
    if (status instanceof LogStatus) {
      fn(status.value);
    }
    fn(status);
  }
}

const LogStatusDecorator = {};
logStatusValues.forEach(status => {
  LogStatusDecorator[status] = value => new LogStatus(status, value);
});

module.exports = {
  prepareForLogging,
  LogStatus,
  LogStatusDecorator,
};
