'use strict';

const { extractDecorator } = require('metaschema');

const transformations = require('./transformations');

const escapeString = value => {
  let backslash = false;
  let escaped = "'";

  for (const character of value) {
    if (character === "'") {
      escaped += "''";
    } else if (character === '\\') {
      escaped += '\\\\';
      backslash = true;
    } else {
      escaped += character;
    }
  }
  escaped += "'";
  return backslash ? ` E${escaped}` : escaped;
};

const escapeIdentifier = name => `"${name}"`;

const escapeKey = key =>
  key
    .split('.')
    .map(k => (k === '*' ? '*' : escapeIdentifier(k)))
    .join('.');

const escapeValue = value => {
  const type = typeof value;
  if (type === 'number') return value;
  if (type === 'string') return escapeString(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  throw new TypeError('Unsupported value (${value}) type');
};

const PREDEFINED_DOMAINS = {
  Time: 'time with time zone',
  DateDay: 'date',
  DateTime: 'timestamp with time zone',
  JSON: 'jsonb',
  Money: 'money',
};

const IGNORED_DOMAINS = ['List', 'Enum', 'HashMap', 'HashSet'];

// https://tools.ietf.org/html/rfc3629#section-3
const utf8bytesLastCodePoints = {
  1: 0x007f,
  2: 0x07ff,
  3: 0xffff,
};

const utf8codePointSize = codePoint => {
  for (let byteCount = 1; byteCount <= 3; byteCount++) {
    if (codePoint <= utf8bytesLastCodePoints[byteCount]) {
      return byteCount;
    }
  }
  return 4;
};

const asciiCP = {
  aToZLower: ['a'.codePointAt(0), 'z'.codePointAt(0)],
  aToZUpper: ['A'.codePointAt(0), 'Z'.codePointAt(0)],
  underscore: '_'.codePointAt(0),
  numbers: ['0'.codePointAt(0), '9'.codePointAt(0)],
  dollar: '$'.codePointAt(0),
};

const classMapping = {
  Uint8Array: 'bytea',
  Date: 'timestamp with time zone',
  Uint64: 'bigint',
};

// https://github.com/postgres/postgres/blob/5f6b0e6d69f1087847c8456b3f69761c950d52c6/src/backend/utils/adt/misc.c#L723
const isValidIdentifierStart = cp =>
  cp === asciiCP.underscore ||
  (cp >= asciiCP.aToZLower[0] && cp <= asciiCP.aToZLower[1]) ||
  (cp >= asciiCP.aToZUpper[0] && cp <= asciiCP.aToZUpper[1]) ||
  cp >= 0x80;

// https://github.com/postgres/postgres/blob/5f6b0e6d69f1087847c8456b3f69761c950d52c6/src/backend/utils/adt/misc.c#L741
const isValidIdentifierCont = cp =>
  (cp >= asciiCP.numbers[0] && cp <= asciiCP.numbers[1]) ||
  cp === asciiCP.dollar ||
  isValidIdentifierStart(cp);

const singleUnitUtf16 = (1 << 16) - 1;

// https://www.postgresql.org/docs/10/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
const isValidIdentifier = name => {
  let length = 0;
  for (let i = 0; i < name.length; i++) {
    const codePoint = name.codePointAt(i);
    if (i === 0) {
      if (!isValidIdentifierStart(codePoint)) {
        return false;
      }
    } else if (!isValidIdentifierCont(codePoint)) {
      return false;
    }
    length += utf8codePointSize(codePoint);
    if (codePoint > singleUnitUtf16) i++;
  }
  return length < 64;
};

const validateIdentifier = (name, type, prefix = '') => {
  if (!isValidIdentifier(name)) {
    throw new Error(
      `Cannot create ${type} ${prefix}${name} ` +
        'because it is not a valid identifier'
    );
  }
};

const generateQueryParams = (count, start = 1) => {
  let params = '';
  for (let i = start; i < start + count; i++) {
    if (i !== start) {
      params += ', ';
    }
    params += `$${i}`;
  }
  return params;
};

const generateLinkQueryParams = (count, start = 1) => {
  let params = '';
  for (let i = start + 1; i < start + 1 + count; i++) {
    if (i !== start + 1) {
      params += ', ';
    }
    params += `($${start}, $${i})`;
  }
  return params;
};

const buildWhere = query => {
  const constraints = transformations.constraints(query);
  const constraintsKeys = Object.keys(constraints);
  if (constraintsKeys.length === 0) {
    return ['', []];
  }
  const params = new Array(constraintsKeys.length);
  return [
    ' WHERE ' +
      constraintsKeys
        .map((key, i) => {
          const [cond, value] = constraints[key];
          params[i] = value;
          return `${escapeKey(key)} ${cond === '!' ? '!=' : cond} $${i + 1}`;
        })
        .join(' AND '),
    params,
  ];
};

const generateDeleteQuery = (category, includedCategories, query) => {
  const escapedCategory = escapeIdentifier(category);
  let deleteQuery =
    `WITH ToDelete AS (SELECT ${escapedCategory}."Id"` +
    ` FROM ${escapedCategory}`;
  includedCategories.forEach(category => {
    const includedCategory = escapeIdentifier(category);
    deleteQuery +=
      ` INNER JOIN ${includedCategory} ON` +
      ` ${escapedCategory}."Id" = ${includedCategory}."Id"`;
  });
  const [where, whereParams] = buildWhere(query);
  deleteQuery += where + ')';
  includedCategories.forEach(category => {
    const includedCategory = escapeIdentifier(category);
    deleteQuery +=
      `, ${category} AS (DELETE FROM ${includedCategory}` +
      ' WHERE "Id" IN (SELECT "Id" FROM ToDelete))';
  });
  deleteQuery +=
    ` DELETE FROM ${escapedCategory}` +
    ' WHERE "Id" IN (SELECT "Id" FROM ToDelete)';
  return [deleteQuery, whereParams];
};

const fitInSchema = (object, schema) => {
  const result = {};
  if (object.Id) {
    result.Id = object.Id;
  }
  for (const prop in schema) {
    const field = schema[prop];
    const value = object[prop];
    if (value !== undefined) {
      result[prop] = value;
    } else if (extractDecorator(field) === 'Include') {
      result[prop] = fitInSchema(object, field.definition);
    }
  }
  return result;
};

const recreateIdTrigger = Symbol('recreateIdTrigger');
const uploadMetadata = Symbol('uploadMetadata');

module.exports = {
  escapeString,
  escapeValue,
  escapeIdentifier,
  escapeKey,
  PREDEFINED_DOMAINS,
  IGNORED_DOMAINS,
  isValidIdentifier,
  validateIdentifier,
  generateQueryParams,
  generateLinkQueryParams,
  buildWhere,
  generateDeleteQuery,
  classMapping,
  fitInSchema,
  symbols: {
    recreateIdTrigger,
    uploadMetadata,
  },
};
