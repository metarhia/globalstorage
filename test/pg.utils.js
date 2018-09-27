'use strict';

const metatests = require('metatests');
const pgUtils = require('../lib/pg.utils');

metatests.case('Test pgUtils.isValidIdentifier', { pgUtils }, {
  'pgUtils.isValidIdentifier': [
    ['validIdentifier', true],
    ['identifierWithSpecialSymbols@!', false],
    ['identifierThatIsValidEvenThoughItIsQuiteLong', true],
    [
      'identifierSoVeryVeryVeryVeryVeryVeryLongThatItIsConsideredInvalid',
      false,
    ],
    ['абвгдежзийклмнопрстуфчцчшщъыьэюя', false],
    ['абвгдежзийклмнопрстуфчцчшщъыьэю', true],
    ['1identifierThatStartsWithANumber', false],
    ['$identifierThatStartsWithADollar', false],
    ['identifierWith2Numbers_9', true],
    ['identifier$Containing$Dollar$', true],
    ['💓💕EmojiIdentifier💗💝', true],
  ],
});
