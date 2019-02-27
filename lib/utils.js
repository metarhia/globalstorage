'use strict';

const runIfFn = (fn, ...args) => {
  if (fn) {
    fn(...args);
  } else {
    const callback = args[args.length - 1];
    callback();
  }
};

const runIf = (condition, fn, ...args) => {
  if (condition) {
    fn(...args);
  } else {
    const callback = args[args.length - 1];
    callback();
  }
};

module.exports = {
  runIf,
  runIfFn,
};
