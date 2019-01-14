'use strict';

const { testSync } = require('metatests');
const transformations = require('../lib/transformations');

testSync('must correctly apply projection', test => {
  test.beforeEach((test, callback) => {
    callback({
      data: [
        { k1: 1, k2: 2, k3: 5 },
        { k1: 2, k2: 42, k3: 13 },
        { k1: 1, k2: 11, k3: 5, k5: 16 },
      ],
    });
  });

  test.testSync('simple projection', (test, { data }) => {
    const expected = [{ k1: 1 }, { k1: 2 }, { k1: 1 }];
    const actual = transformations.projection(['k1'], data);
    test.strictSame(actual, expected);
  });

  test.testSync('simple projection with missing', (test, { data }) => {
    const expected = [{ k1: 1 }, { k1: 2 }, { k1: 1, k5: 16 }];
    const actual = transformations.projection(['k1', 'k5', 'k6'], data);
    test.strictSame(actual, expected);
  });

  test.testSync('complex projection no functions', (test, { data }) => {
    const expected = [
      { kk1: 1, kk2: 2 },
      { kk1: 2, kk2: 42 },
      { kk1: 1, kk2: 11 },
    ];
    const actual = transformations.projection(
      { kk1: ['k1'], kk2: ['k2'] },
      data
    );
    test.strictSame(actual, expected);
  });

  test.testSync('complex projection with functions', (test, { data }) => {
    const expected = [
      { kk1: 2, kk2: 6 },
      { kk1: 4, kk2: 126 },
      { kk1: 2, kk2: 33 },
    ];
    const actual = transformations.projection(
      { kk1: ['k1', x => x * 2], kk2: ['k2', x => x * 3] },
      data
    );
    test.strictSame(actual, expected);
  });
});
