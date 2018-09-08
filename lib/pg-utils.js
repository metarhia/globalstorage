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

const PREDEFINED_DOMAINS = {
  Time: 'time with time zone',
  DateDay: 'date',
  DateTime: 'timestamp with time zone',
  Id: 'bigint',
};

module.exports = {
  escapeString,
  PREDEFINED_DOMAINS,
};
