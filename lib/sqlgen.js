'use strict';

const { iter } = require('metarhia-common');
const { escapeValue, escapeIdentifier } = require('./pg.utils');

const allowedConditions = [
  '=', '!=', '<', '<=', '>', '>=', 'LIKE',
];

const supportedOps = {
  'select': Set,
  'selectDistinct': null,
  'count': Array,
  'avg': Array,
  'min': Array,
  'max': Array,
  'sum': Array,
  'where': Array,
  'groupBy': Set,
  'orderBy': Set,
  'from': null,
  'limit': null,
  'offset': null,
};

const functionHandlers = {
  'count': op => `count(${op.field})`,
  'avg': op => `avg(${op.field})`,
  'min': op => `min(${op.field})`,
  'max': op => `max(${op.field})`,
  'sum': op => `sum(${op.field})`,
};

const checkType = (value, name, type) => {
  if (typeof value !== type) {
    throw new TypeError(
      `Invalid '${name}' value (${value}) type, expected '${type}'`
    );
  }
};

class SelectBuilder {
  constructor() {
    this.operations = new Map();
    for (const op of Object.keys(supportedOps)) {
      const constructor = supportedOps[op];
      this.operations.set(op, constructor ? new constructor() : null);
    }
  }

  from(tableName) {
    this.operations.set('from', escapeIdentifier(tableName));
    return this;
  }

  select(...fields) {
    const select = this.operations.get('select');
    iter(fields).map(escapeIdentifier).forEach(f => select.add(f));
    return this;
  }

  distinct() {
    this.operations.set('selectDistinct', true);
    return this;
  }

  where(key, cond, value) {
    cond = cond.toUpperCase();
    if (!allowedConditions.includes(cond)) {
      throw new Error(`The operator "${cond}" is not permitted`);
    }
    this.operations.get('where').push({
      key: escapeIdentifier(key),
      value: escapeValue(value),
      cond,
    });
    return this;
  }

  whereNot(key, cond, value) {
    cond = cond.toUpperCase();
    if (!allowedConditions.includes(cond)) {
      throw new Error(`The operator "${cond}" is not permitted`);
    }
    this.operations.get('where').push({
      key: escapeIdentifier(key),
      value: escapeValue(value),
      cond,
      mod: 'NOT',
    });
    return this;
  }

  whereNull(key) {
    this.operations.get('where').push({
      key: escapeIdentifier(key),
      cond: 'IS',
      value: 'null',
    });
    return this;
  }

  whereNotNull(key) {
    this.operations.get('where').push({
      key: escapeIdentifier(key),
      cond: 'IS',
      value: 'null',
      mod: 'NOT',
    });
    return this;
  }

  whereIn(key, conds) {
    this.operations.get('where').push({
      key: escapeIdentifier(key),
      cond: 'IN',
      value: `(${conds.map(escapeValue).join(', ')})`,
    });
    return this;
  }

  whereNotIn(key, conds) {
    this.operations.get('where').push({
      key: escapeIdentifier(key),
      cond: 'IN',
      value: `(${conds.map(escapeValue).join(', ')})`,
      mod: 'NOT',
    });
    return this;
  }

  orderBy(field, dir = 'ASC') {
    dir = dir.toUpperCase();
    this.operations.get('orderBy').add({ field: escapeIdentifier(field), dir });
    return this;
  }

  groupBy(...fields) {
    const groupBy = this.operations.get('groupBy');
    iter(fields).map(escapeIdentifier).forEach(f => groupBy.add(f));
    return this;
  }

  limit(limit) {
    checkType(limit, 'limit', 'number');
    this.operations.set('limit', limit);
    return this;
  }

  offset(offset) {
    checkType(offset, 'offset', 'number');
    this.operations.set('offset', offset);
    return this;
  }

  count(field = '*') {
    if (field !== '*') field = escapeIdentifier(field);
    this.operations.get('count').push({ field });
    return this;
  }

  avg(field) {
    this.operations.get('avg').push({ field: escapeIdentifier(field) });
    return this;
  }

  min(field) {
    this.operations.get('min').push({ field: escapeIdentifier(field) });
    return this;
  }

  max(field) {
    this.operations.get('max').push({ field: escapeIdentifier(field) });
    return this;
  }

  sum(field) {
    this.operations.get('sum').push({ field: escapeIdentifier(field) });
    return this;
  }

  processSelect(query, clauses) {
    if (clauses.size > 0) {
      return query + ' ' + iter(clauses).reduce((acc, id) => acc + ', ' + id);
    }
    return query + ' *';
  }

  processOperations(query, operations, functionHandlers) {
    for (const fn of Object.keys(functionHandlers)) {
      const ops = operations.get(fn);
      if (ops.length === 0) continue;
      else if (query.endsWith(' *')) query = query.slice(0, -2);
      else query += ',';
      const handler = functionHandlers[fn];
      // eslint-disable-next-line no-loop-func
      query += ops.reduce((acc, op) => acc + handler(op, query) + ',', ' ')
        .slice(0, -1);
    }
    return query;
  }

  processWhere(query, clauses) {
    // TODO(lundibundi): support braces
    query += ' WHERE';
    const it = iter(clauses);
    const firstClause = it.next().value;
    if (firstClause.mod) query += ' ' + firstClause.mod;
    query += ` ${firstClause.key} ${firstClause.cond} ${firstClause.value}`;
    for (const clause of it) {
      if (clause.or) query += ' OR';
      else query += ' AND';
      if (clause.mod) query += ' ' + clause.mod;
      query += ` ${clause.key} ${clause.cond} ${clause.value}`;
    }
    return query;
  }

  processOrder(query, clauses) {
    const it = iter(clauses);
    const firstClause = it.next().value;
    query += ` ORDER BY ${firstClause.field} ${firstClause.dir}`;
    for (const order of it) {
      query += `, ${order.field} ${order.dir}`;
    }
    return query;
  }

  toString() {
    let query = 'SELECT';

    if (this.operations.get('selectDistinct')) query += ' DISTINCT';

    query = this.processSelect(query, this.operations.get('select'));

    query = this.processOperations(query, this.operations, functionHandlers);

    const tableName = this.operations.get('from');
    if (!tableName) {
      throw new Error('Cannot generate SQL, tableName is not defined');
    }
    query += ` FROM ${tableName}`;

    const whereClauses = this.operations.get('where');
    if (whereClauses.length > 0) {
      query = this.processWhere(query, whereClauses);
    }

    const groupClauses = this.operations.get('groupBy');
    if (groupClauses.size > 0) {
      query += ' GROUP BY ' +
        iter(groupClauses).reduce((acc, field) => acc + ', ' + field);
    }

    const orderClauses = this.operations.get('orderBy');
    if (orderClauses.size > 0) {
      query = this.processOrder(query, orderClauses);
    }

    const limit = this.operations.get('limit');
    if (limit) query += ` LIMIT ${limit}`;

    const offset = this.operations.get('offset');
    if (offset) query += ` OFFSET ${offset}`;

    return query;
  }
}

module.exports = { SelectBuilder };
