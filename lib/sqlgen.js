'use strict';

const { iter } = require('metarhia-common');
const { escapeString } = require('./pg-utils.js');

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

const escapeValue = value => {
  const type = typeof value;
  if (type === 'number') return value;
  if (type === 'string') return escapeString(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  throw new TypeError('Unsupported value (${value}) type');
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
    this.operations.set('from', tableName);
    return this;
  }

  select(...fields) {
    const select = this.operations.get('select');
    iter(fields).forEach(f => select.add(f));
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
      key,
      cond,
      value: escapeValue(value),
    });
    return this;
  }

  whereNot(key, cond, value) {
    cond = cond.toUpperCase();
    if (!allowedConditions.includes(cond)) {
      throw new Error(`The operator "${cond}" is not permitted`);
    }
    this.operations.get('where').push({
      key,
      cond,
      value: escapeValue(value),
      mod: 'NOT',
    });
    return this;
  }

  whereNull(key) {
    this.operations.get('where').push({ key, cond: 'IS', value: 'null' });
    return this;
  }

  whereNotNull(key) {
    this.operations.get('where').push({
      key,
      cond: 'IS',
      value: 'null',
      mod: 'NOT',
    });
    return this;
  }

  whereIn(key, conds) {
    this.operations.get('where').push({
      key,
      cond: 'IN',
      value: `(${conds.map(escapeValue).join(', ')})`,
    });
    return this;
  }

  whereNotIn(key, conds) {
    this.operations.get('where').push({
      key,
      cond: 'IN',
      value: `(${conds.map(escapeValue).join(', ')})`,
      mod: 'NOT',
    });
    return this;
  }

  orderBy(field, dir = 'ASC') {
    dir = dir.toUpperCase();
    this.operations.get('orderBy').add({ field, dir });
    return this;
  }

  groupBy(...fields) {
    const groupBy = this.operations.get('groupBy');
    iter(fields).forEach(f => groupBy.add(f));
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
    this.operations.get('count').push({ field });
    return this;
  }

  avg(field) {
    this.operations.get('avg').push({ field });
    return this;
  }

  min(field) {
    this.operations.get('min').push({ field });
    return this;
  }

  max(field) {
    this.operations.get('max').push({ field });
    return this;
  }

  sum(field) {
    this.operations.get('sum').push({ field });
    return this;
  }

  toString() {
    let query = 'SELECT';

    if (this.operations.get('selectDistinct')) query += ' DISTINCT';

    // handle initial select clause
    const select = this.operations.get('select');
    if (select.size > 0) {
      query += ' ' + iter(select).reduce((acc, id) => acc + ', ' + id);
    } else {
      query += ' *';
    }

    // handle operations
    for (const fn of Object.keys(functionHandlers)) {
      const ops = this.operations.get(fn);
      if (ops.length === 0) continue;
      else if (query.endsWith(' *')) query = query.slice(0, -2);
      else query += ',';
      const handler = functionHandlers[fn];
      // eslint-disable-next-line no-loop-func
      query += ops.reduce((acc, op) => acc + handler(op, query) + ',', ' ')
        .slice(0, -1);
    }

    // handle from
    const tableName = this.operations.get('from');
    if (!tableName) {
      throw new Error('Cannot generate SQL, tableName is undefined');
    }
    query += ` FROM ${tableName}`;

    // handle where clauses
    const whereClauses = this.operations.get('where');
    if (whereClauses.length > 0) {
      // TODO(lundibundi): support braces
      query += ' WHERE';
      const firstClause = whereClauses[0];
      if (firstClause.mod) query += ' ' + firstClause.mod;
      query += ` ${firstClause.key} ${firstClause.cond} ${firstClause.value}`;
      for (const clause of iter(whereClauses).skip(1)) {
        if (clause.or) query += ' OR';
        else query += ' AND';
        if (clause.mod) query += ' ' + clause.mod;
        query += ` ${clause.key} ${clause.cond} ${clause.value}`;
      }
    }

    // handle group by clauses
    const groupClauses = this.operations.get('groupBy');
    if (groupClauses.size > 0) {
      query += ' GROUP BY ' +
        iter(groupClauses).reduce((acc, field) => acc + ', ' + field);
    }

    // handle order clauses
    const orderClauses = this.operations.get('orderBy');
    if (orderClauses.size > 0) {
      const clauses = iter(orderClauses);
      const firstClause = clauses.next().value;
      query += ` ORDER BY ${firstClause.field} ${firstClause.dir}`;
      for (const order of clauses) {
        query += `, ${order.field} ${order.dir}`;
      }
    }

    // handle limit and offset
    const limit = this.operations.get('limit');
    if (limit) query += ` LIMIT ${limit}`;

    const offset = this.operations.get('offset');
    if (offset) query += ` OFFSET ${offset}`;

    return query;
  }
}

module.exports = { SelectBuilder };
