'use strict';

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\s+/g, ' ')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .trim();

function* extractTrigrams(text) {
  const normalized = normalize(text);

  for (let i = 0; i <= normalized.length - 3; i++) {
    yield normalized.slice(i, i + 3);
  }
}

function* extractStrings(data) {
  if (typeof data === 'string') {
    yield data;
  } else if (data !== null && typeof data === 'object') {
    for (const key in data) yield* extractStrings(data[key]);
  }
}

const extractRecordTrigrams = (data) => {
  const counts = new Map();
  const strings = extractStrings(data);

  for (const str of strings) {
    const trigrams = extractTrigrams(str);

    for (const trigram of trigrams) {
      counts.set(trigram, (counts.get(trigram) || 0) + 1);
    }
  }

  return counts;
};

module.exports = {
  normalize,
  extractTrigrams,
  extractStrings,
  extractRecordTrigrams,
};
