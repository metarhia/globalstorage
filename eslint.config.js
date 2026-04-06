'use strict';

const init = require('eslint-config-metarhia');

module.exports = [
  { ignores: ['globalstorage.mjs'] },
  ...init,
  {
    files: ['dist/**/*.js'],
    languageOptions: {
      sourceType: 'module',
    },
  },
];
