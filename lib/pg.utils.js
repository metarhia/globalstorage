'use strict';

const transformations = require('./transformations');

const escapeString = value => {
  let backslash = false;
  let escaped = '\'';

  for (const character of value) {
    if (character === '\'') {
      escaped += '\'\'';
    } else if (character === '\\') {
      escaped += '\\\\';
      backslash = true;
    } else {
      escaped += character;
    }
  }
  escaped += '\'';
  return backslash ? ` E${escaped}` : escaped;
};

const escapeIdentifier = name => `"${name}"`;

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
  Id: 'bigint',
  JSON: 'jsonb',
};

const IGNORED_DOMAINS = ['List', 'Enum', 'HashMap', 'HashSet'];

// https://tools.ietf.org/html/rfc3629#section-3
const utf8bytesLastCodePoints = {
  1: 0x007F,
  2: 0x07FF,
  3: 0xFFFF,
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
};

// https://github.com/postgres/postgres/blob/5f6b0e6d69f1087847c8456b3f69761c950d52c6/src/backend/utils/adt/misc.c#L723
const isValidIdentifierStart = cp => cp === asciiCP.underscore ||
  (cp >= asciiCP.aToZLower[0] && cp <= asciiCP.aToZLower[1]) ||
  (cp >= asciiCP.aToZUpper[0] && cp <= asciiCP.aToZUpper[1]) ||
  cp >= 0x80;

// https://github.com/postgres/postgres/blob/5f6b0e6d69f1087847c8456b3f69761c950d52c6/src/backend/utils/adt/misc.c#L741
const isValidIdentifierCont =
  cp => (cp >= asciiCP.numbers[0] && cp <= asciiCP.numbers[1]) ||
    cp === asciiCP.dollar ||
    isValidIdentifierStart(cp);

const singleUnitUtf16 = 1 << 16 - 1;

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
      `Cannot create ${type} ${prefix}${name}` +
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

const buildWhere = query => {
  const constraints = transformations.constraints(query);
  const constraintsKeys = Object.keys(constraints);
  if (constraintsKeys.length === 0) {
    return ['', []];
  }
  const params = new Array(constraintsKeys.length);
  return [' WHERE ' + constraintsKeys.map((key, i) => {
    const [cond, value] = constraints[key];
    params[i] = value;
    return `${escapeIdentifier(key)} ${cond === '!' ? '!=' : cond} $${i + 1}`;
  }).join(' AND '), params];
};

module.exports = {
  escapeString,
  escapeValue,
  escapeIdentifier,
  PREDEFINED_DOMAINS,
  IGNORED_DOMAINS,
  isValidIdentifier,
  validateIdentifier,
  generateQueryParams,
  buildWhere,
  classMapping,
};
