'use strict';

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
  return (backslash ? ` E${escaped}` : escaped);
};

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
  JSON: 'json',
};

const IGNORED_DOMAINS = ['List', 'Enum', 'HashMap', 'HashSet'];

const isValidIdentifier =
  name => !'0123456789'.includes(name[0]); // TODO: implement validation

module.exports = {
  escapeString,
  escapeValue,
  PREDEFINED_DOMAINS,
  IGNORED_DOMAINS,
  isValidIdentifier,
};
