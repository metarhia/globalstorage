'use strict';

// should it be imported from metaschema?
const { COUNTER } = require('./type');
const DELTA_COUNTER = 'delta-counter';

const init = () => ({
  // corresponds to the type in the schema
  type: COUNTER,
  // corresponds to the CRDT strategy
  strategy: DELTA_COUNTER,
  storage: new Map(),
});

const value = (state) => {
  const values = Array.from(state.values());
  return values.reduce((acc, current) => acc + current, 0);
};

const keysUnion = (state1, state2) => {
  const keys = new Set();
  for (const key of state1.keys()) keys.add(key);
  for (const key of state2.keys()) keys.add(key);
  return keys;
};

const join = (state1, delta1) => {
  const result = init();
  for (const key of keysUnion(state1, delta1)) {
    const value1 = state1.storage.get(key) || 0;
    const value2 = delta1.storage.get(key) || 0;
    result.storage.set(key, Math.max(value1, value2));
  }
  return result;
};

const delta = (state1, state2) => {
  const result = init();
  for (const key of keysUnion(state1, state2)) {
    const value1 = state1.storage.get(key) || 0;
    const value2 = state2.storage.get(key) || 0;
    result.storage.set(key, value1 - value2);
  }
  return result;
};

const inc = (id, state, increment = 1) => {
  const delta = init();
  const value = state.storage.get(id) || 0;
  delta.storage.set(id, value + increment);
  return delta;
};

const create = () => {
  const state = init();
  return {
    state: () => state,
    inc: (id, increment = 1) => inc(id, state, increment),
    join: (delta) => join(state, delta),
    delta: (state2) => delta(state, state2),
  };
};

module.exports = {
  init,
  create,
  value,
  join,
  inc,
};
