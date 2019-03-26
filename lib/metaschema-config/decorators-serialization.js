'use strict';

const mdsf = require('mdsf');
const { iter } = require('@metarhia/common');
const { extractDecorator } = require('metaschema');

const replacer = (name, value) =>
  typeof value === 'function' ? value.toString() : value;

const exclude = name => ['definition'].includes(name);

const stringifyGroup = ins =>
  iter(ins)
    .map(value => {
      const decName = extractDecorator(value);
      if (decName === 'String') {
        return mdsf.stringify(value);
      }
      // eslint-disable-next-line no-use-before-define
      return serializeDecorated('application', decName, value);
    })
    .join(',', '[', ']');

const stringifyInstance = (obj, decorator) => {
  const source = iter(Object.entries({ ...obj }))
    .filter(([key, value]) => !exclude(key, value))
    .map(([key, value]) => {
      const stringifyValue =
        typeof value === 'function'
          ? value.toString()
          : mdsf.stringify(value, replacer);
      return `${key}:${stringifyValue}`;
    })
    .join(',', '{', '}');
  return `${decorator}(${source})`;
};

const decorators = {
  domains: {
    Enum: ins => `Enum('${ins.values.join("','")}')`,
    Flags: ins =>
      ins.enum
        ? `Flags({enumDomain:'${ins.enum}'})`
        : `Flags('${ins.values.join("','")}')`,
  },

  category: {
    Validate: ins => `Validate(${ins.validate.toString()})`,

    Index: ins => `Index('${ins.fields.join("','")}')`,
    Unique: ins => `Unique('${ins.fields.join("','")}')`,

    Table: ({ config, ...def }, excludedKeys) =>
      `Table(${stringifyInstance(def, excludedKeys)},${config})`,
  },

  application: {
    AppMenuGroup: ins => `Group('${ins.name}',${stringifyGroup(ins.children)})`,
  },
};

const serializeDecorated = (type, decorator, ins) =>
  (decorators[type][decorator] || stringifyInstance)(ins, decorator);

module.exports = { serializeDecorated, stringifyGroup };
