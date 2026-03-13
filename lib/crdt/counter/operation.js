'use strict';

const { COUNTER } = require('./type');
const OPERATION_COUNTER = 'operation-counter';

const init = (id) => ({
  // corresponds to the type in the schema
  type: COUNTER,
  // corresponds to the CRDT strategy
  strategy: OPERATION_COUNTER,
  id,
  seq: 0,
  ops: [],
  applied: new Set(),
});

const update = ({ id, seq, ops, applied }, delta) => {
  const opId = `${id}:${seq++}`;
  ops.push({ id: opId, delta });
  applied.add(opId);
};

const merge = (state, ops) => {
  const { ops: stateOps, applied } = state;
  for (const op of ops) {
    if (!applied.has(op.id)) {
      stateOps.push(op);
      applied.add(op.id);
    }
  }
  return state;
};

const value = ({ ops }) => ops.reduce((sum, { delta }) => sum + delta, 0);

const operations = ({ ops }) => ops;

const create = (id) => {
  const counter = init(id);
  return {
    state: () => counter,
    value: () => value(counter),
    operations: () => operations(counter),
    inc: (delta = 1) => update(counter, delta),
    dec: (delta = 1) => update(counter, -delta),
    merge: (ops) => merge(counter, ops),
  };
};

module.exports = { create, init, update, merge, value, operations };
