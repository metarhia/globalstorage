'use strict';

const metatests = require('metatests');
const pgUtils = require('../lib/pg.utils');

metatests.case(
  'Test pgUtils',
  { pgUtils },
  {
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
      ['ꬰꬱꬲꬳꬴꬵꬶꬷꬸꬹꬺꬻꬼꬽꬾꬿꭀꭁꭂꭃꭄꭅꭆꭇꭈꭉ', false],
    ],
    'pgUtils.generateDeleteQuery': [
      [
        'A',
        [],
        {},
        [
          'WITH ToDelete AS (SELECT "A"."Id" FROM "A") ' +
            'DELETE FROM "A" WHERE "Id" IN (SELECT "Id" FROM ToDelete)',
          [],
        ],
      ],
      [
        'A',
        ['B'],
        {},
        [
          'WITH ToDelete AS (SELECT "A"."Id" FROM "A"' +
            ' INNER JOIN "B" ON "A"."Id" = "B"."Id"),' +
            ' B AS (DELETE FROM "B"' +
            ' WHERE "Id" IN (SELECT "Id" FROM ToDelete))' +
            ' DELETE FROM "A" WHERE "Id" IN (SELECT "Id" FROM ToDelete)',
          [],
        ],
      ],
      [
        'A',
        ['B'],
        { 'A.Z': 10 },
        [
          'WITH ToDelete AS (SELECT "A"."Id" FROM "A"' +
            ' INNER JOIN "B" ON "A"."Id" = "B"."Id" WHERE "A"."Z" = $1),' +
            ' B AS (DELETE FROM "B"' +
            ' WHERE "Id" IN (SELECT "Id" FROM ToDelete))' +
            ' DELETE FROM "A" WHERE "Id" IN (SELECT "Id" FROM ToDelete)',
          [10],
        ],
      ],
    ],
    'pgUtils.escapeKey': [
      ['A', '"A"'],
      ['A.B', '"A"."B"'],
      ['A.*', '"A".*'],
      ['*', '*'],
    ],
    'pgUtils.generateLinkQueryParams': [
      [1, 1, '($1, $2)'],
      [2, 1, '($1, $2), ($1, $3)'],
      [3, 1, '($1, $2), ($1, $3), ($1, $4)'],
      [3, 3, '($3, $4), ($3, $5), ($3, $6)'],
    ],
  }
);
