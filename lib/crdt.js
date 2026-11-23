'use strict';

const RESERVED_KEYS = ['__proto__', 'constructor', 'prototype'];
const MAX_DEPTH = 32;
const NO_CHANGE = Symbol('no change');
const NESTED = Symbol('nested map');

const isObject = (value) => {
  const isStructured = typeof value === 'object' && value !== null;
  return isStructured && !Array.isArray(value) && !(value instanceof Set);
};

const hasTag = (value, tag) => isObject(value) && Object.hasOwn(value, tag);
const isRegister = (value) => hasTag(value, '$lww');
const isCounter = (value) => hasTag(value, '$counter');
const isTagged = (value) => isRegister(value) || isCounter(value);
const isMap = (value) => isObject(value) && !isTagged(value);
const isSet = (value) => Array.isArray(value) || value instanceof Set;
const ownValue = (map, key) => (Object.hasOwn(map, key) ? map[key] : undefined);
const emptyCounter = () => ({ $counter: { inc: {}, dec: {} } });

const compareValues = (a, b) => {
  const left = JSON.stringify(a);
  const right = JSON.stringify(b);
  if (left === right) return 0;
  return left > right ? 1 : -1;
};

// Later time wins, then larger replica id, then larger value: every replica
// picks the same register whatever order deltas arrive in
const compareRegisters = (a, b) => {
  if (a.time !== b.time) return a.time - b.time;
  if (a.replica !== b.replica) return a.replica > b.replica ? 1 : -1;
  return compareValues(a.value, b.value);
};

const joinRegister = (source, delta) => {
  if (!isRegister(source)) return delta;
  const isNewer = compareRegisters(delta.$lww, source.$lww) > 0;
  return isNewer ? delta : source;
};

const above = (source = {}, target = {}) => {
  let result = null;
  const keys = Object.keys(target);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const count = target[key];
    const current = ownValue(source, key) ?? 0;
    if (count <= current) continue;
    result ??= {};
    result[key] = count;
  }
  return result;
};

const raise = (source = {}, delta = {}) => {
  const grown = above(source, delta);
  return grown === null ? source : { ...source, ...grown };
};

const joinCounter = (source, delta) => {
  if (isRegister(source)) return source;
  const base = isCounter(source) ? source : emptyCounter();
  const before = base.$counter;
  const after = delta.$counter;
  const inc = raise(before.inc, after.inc);
  const dec = raise(before.dec, after.dec);
  const isSame = inc === before.inc && dec === before.dec;
  return isSame ? base : { $counter: { inc, dec } };
};

// Sets are kept sorted so replicas hold equal arrays whatever the order
const compareItems = (a, b) => {
  const left = typeof a;
  const right = typeof b;
  if (left !== right) return left > right ? 1 : -1;
  if (left === 'number') return a - b;
  return compareValues(a, b);
};

const addAll = (items, values) => {
  if (Array.isArray(values)) {
    for (let i = 0; i < values.length; i++) items.add(values[i]);
    return;
  }
  for (const item of values) items.add(item);
};

const union = (source, delta) => {
  const items = new Set(isSet(source) ? source : []);
  const size = items.size;
  addAll(items, delta);
  const isSame = items.size === size && Array.isArray(source);
  return isSame ? source : Array.from(items).toSorted(compareItems);
};

// Patch removal: CRDT values are removed by a tombstone, not by absence
const removeValue = (value) => (isTagged(value) ? value : undefined);

// Plain values follow merge patch rules and never replace CRDT values
const join = (source, delta) => {
  if (delta === undefined) return removeValue(source);
  if (isRegister(delta)) return joinRegister(source, delta);
  if (isCounter(delta)) return joinCounter(source, delta);
  if (isTagged(source)) return source;
  if (isSet(delta)) return union(source, delta);
  if (isObject(delta)) return NESTED;
  return Object.is(source, delta) ? source : delta;
};

// Absence removes the key; storing undefined would keep it for later diffs
const omitKey = (record, key) => {
  const next = {};
  const names = Object.keys(record);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name !== key) next[name] = record[name];
  }
  return next;
};

// Copy on write: unchanged map is returned as is, so callers can see growth
const mergeMaps = (source, delta) => {
  let result = source;
  const keys = Object.keys(delta);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const before = ownValue(source, key);
    const value = delta[key];
    let joined = join(before, value);
    if (joined === NESTED) {
      const base = isMap(before) ? before : {};
      joined = mergeMaps(base, value);
    }
    if (joined === before) continue;
    if (joined === undefined) {
      const base = result === source ? source : result;
      result = omitKey(base, key);
      continue;
    }
    if (result === source) result = { ...source };
    result[key] = joined;
  }
  return result;
};

const merge = (source, delta) => {
  if (!isObject(delta)) return source;
  const base = isObject(source) ? source : {};
  return mergeMaps(base, delta);
};

const apply = (source, deltas) => {
  if (!Array.isArray(deltas)) return source;
  let result = source;
  for (let i = 0; i < deltas.length; i++) result = merge(result, deltas[i]);
  return result;
};

const diffCounter = (source, target) => {
  if (!isCounter(source)) return target;
  const before = source.$counter;
  const after = target.$counter;
  const inc = above(before.inc, after.inc);
  const dec = above(before.dec, after.dec);
  if (inc === null && dec === null) return NO_CHANGE;
  return { $counter: { inc: inc ?? {}, dec: dec ?? {} } };
};

const diffSet = (source, target) => {
  if (!isSet(source)) return Array.from(target);
  const known = new Set(source);
  const items = Array.from(new Set(target));
  const added = items.filter((item) => !known.has(item));
  return added.length > 0 ? added : NO_CHANGE;
};

const diffValue = (source, target) => {
  if (isRegister(target)) {
    const isKnown = joinRegister(source, target) === source;
    return isKnown ? NO_CHANGE : target;
  }
  if (isRegister(source)) return NO_CHANGE;
  if (isCounter(target)) return diffCounter(source, target);
  if (isCounter(source)) return NO_CHANGE;
  if (isSet(target)) return diffSet(source, target);
  if (!isObject(target)) return source === target ? NO_CHANGE : target;
  return isMap(source) ? NESTED : target;
};

const diff = (source, target) => {
  const before = isObject(source) ? source : {};
  const after = isObject(target) ? target : {};
  const delta = {};
  const keys = Object.keys(after);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = after[key];
    if (!Object.hasOwn(before, key)) {
      delta[key] = value;
      continue;
    }
    const current = before[key];
    let change = diffValue(current, value);
    if (change === NESTED) change = diff(current, value);
    const isEmpty = isObject(change) && Object.keys(change).length === 0;
    if (change !== NO_CHANGE && !isEmpty) delta[key] = change;
  }
  const previous = Object.keys(before);
  for (let i = 0; i < previous.length; i++) {
    const key = previous[i];
    const isKept = Object.hasOwn(after, key) || isTagged(before[key]);
    if (!isKept) delta[key] = undefined;
  }
  return delta;
};

const total = (counts = {}) => {
  let sum = 0;
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i++) sum += counts[keys[i]];
  return sum;
};

const materialize = (state) => {
  if (isRegister(state)) return state.$lww.value;
  if (isCounter(state)) {
    const { inc, dec } = state.$counter;
    return total(inc) - total(dec);
  }
  if (isSet(state)) return Array.from(state);
  if (!isObject(state)) return state;
  const result = {};
  const keys = Object.keys(state);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const node = state[key];
    const value = materialize(node);
    const isRemoved = value === null && isRegister(node);
    if (!isRemoved) result[key] = value;
  }
  return result;
};

const latestTime = (state) => {
  if (isRegister(state)) return state.$lww.time;
  if (!isMap(state)) return 0;
  let latest = 0;
  const keys = Object.keys(state);
  for (let i = 0; i < keys.length; i++) {
    const time = latestTime(state[keys[i]]);
    if (time > latest) latest = time;
  }
  return latest;
};

const copyValue = (value) => {
  const isStructured = typeof value === 'object' && value !== null;
  return isStructured ? structuredClone(value) : value;
};

const assign = (fields, stamp) => {
  const { time, replica } = stamp;
  const delta = {};
  const keys = Object.keys(fields);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const field = fields[key];
    if (field === undefined) continue;
    const value = copyValue(field);
    delta[key] = { $lww: { value, time, replica } };
  }
  return delta;
};

const countOf = (state, path, side, replica) => {
  let node = state;
  for (let i = 0; i < path.length; i++) {
    node = isMap(node) ? ownValue(node, path[i]) : undefined;
  }
  if (!isCounter(node)) return 0;
  const counts = node.$counter[side] ?? {};
  return ownValue(counts, replica) ?? 0;
};

// Each replica raises only its own entry: a delta carries the new total
// for this replica, so it can be merged many times and in any order
const increment = (state, path, amount, replica) => {
  const side = amount < 0 ? 'dec' : 'inc';
  const current = countOf(state, path, side, replica);
  const counter = { inc: {}, dec: {} };
  counter[side] = { [replica]: current + Math.abs(amount) };
  let delta = { $counter: counter };
  for (let i = path.length - 1; i >= 0; i--) delta = { [path[i]]: delta };
  return delta;
};

const isPrimitive = (value) => {
  const type = typeof value;
  if (type === 'number') return Number.isFinite(value);
  return value === null || type === 'string' || type === 'boolean';
};

const isPlainObject = (value) => {
  if (!isObject(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isJson = (value, depth) => {
  if (isPrimitive(value)) return true;
  if (depth > MAX_DEPTH) return false;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!isJson(value[i], depth + 1)) return false;
    }
    return true;
  }
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (RESERVED_KEYS.includes(key)) return false;
    if (!isJson(value[key], depth + 1)) return false;
  }
  return true;
};

const isCounts = (counts) => {
  if (counts === undefined) return true;
  if (!isPlainObject(counts)) return false;
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const count = counts[key];
    if (RESERVED_KEYS.includes(key)) return false;
    if (!Number.isSafeInteger(count) || count < 0) return false;
  }
  return true;
};

const isValidRegister = (register, depth) => {
  if (!isPlainObject(register)) return false;
  const { value, time, replica } = register;
  const hasStamp = Number.isFinite(time) && typeof replica === 'string';
  return hasStamp && isJson(value, depth + 1);
};

const isValidCounter = (counter) => {
  if (!isPlainObject(counter)) return false;
  return isCounts(counter.inc) && isCounts(counter.dec);
};

const isLeaf = (node, depth) => {
  const isSingle = isObject(node) && Object.keys(node).length === 1;
  if (isRegister(node)) return isSingle && isValidRegister(node.$lww, depth);
  if (isCounter(node)) return isSingle && isValidCounter(node.$counter);
  return Array.isArray(node) && node.every(isPrimitive);
};

// Deltas from the network hold CRDT values only: registers, counters,
// sets of primitives, and maps of those
const isDelta = (delta, depth = 0) => {
  if (!isPlainObject(delta) || depth > MAX_DEPTH) return false;
  const keys = Object.keys(delta);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const node = delta[key];
    if (RESERVED_KEYS.includes(key)) return false;
    const isNested = isMap(node);
    if (isNested && !isDelta(node, depth + 1)) return false;
    if (!isNested && !isLeaf(node, depth)) return false;
  }
  return true;
};

module.exports = {
  diff,
  merge,
  apply,
  materialize,
  latestTime,
  assign,
  increment,
  isDelta,
};
