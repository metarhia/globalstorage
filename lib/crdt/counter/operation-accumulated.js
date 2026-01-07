'use strict';

const { COUNTER } = require('./type');

const OPERATION_ACCUMULATED_COUNTER = 'operation-accumulated-counter';

const init = () => ({
  // corresponds to the type in the schema
  type: COUNTER,
  // corresponds to the CRDT strategy
  strategy: OPERATION_ACCUMULATED_COUNTER,
  value: 0,
  delta: 0,
});

const update = (counter, delta) => {
  counter.value += delta;
  counter.delta += delta;
};

const value = (counter) => counter.value;

const merge = (counter, delta) => {
  counter.value += delta;
  return counter;
};

const sync = (counter, callback) => {
  callback(counter.delta);
  counter.delta = 0;
};

const create = () => {
  const counter = init();
  return {
    state: () => counter,
    value: () => counter.value,
    inc: (delta = 1) => update(counter, delta),
    dec: (delta = 1) => update(counter, -delta),
    // Do we actually need both sync and merge?
    merge: (delta) => merge(counter, delta),
    sync: (callback) => sync(counter, callback),
  };
};

module.exports = { create, init, update, merge, sync, value };
