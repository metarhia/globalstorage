'use strict';

const { iter } = require('metarhia-common');

const transformations = require('./transformations');
const { Cursor } = require('./cursor');
const { escapeString } = require('./pg-utils.js');

const escapeValue = value => {
  const type = typeof value;
  if (type === 'number') return value;
  if (type === 'string') return escapeString(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  throw new TypeError('Unsupported value (${value}) type');
};

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

const whereNot = (ops, key, cond, value) => {
  cond = cond.toUpperCase();
  if (!allowedConditions.includes(cond)) {
    throw new Error(`The operator "${cond}" is not permitted`);
  }
  ops.push({ key, cond, value: escapeValue(value), mod: 'NOT' });
};

const where = (ops, key, cond, value) => {
  cond = cond.toUpperCase();
  if (!allowedConditions.includes(cond)) {
    throw new Error(`The operator "${cond}" is not permitted`);
  }
  ops.push({ key, cond, value: escapeValue(value) });
};

const functionalHandlers = ['count', 'avg', 'min', 'max', 'sum'];

const jsqlToSql = {
  'select': (map, query) => {
    const ops = map.get('where');
    const constraints = transformations.constraints(query);
    Object.keys(constraints).forEach(key => {
      const [cond, value] = constraints[key];
      if (cond === '!') whereNot(ops, value);
      else where(ops, key, cond, value);
    });
  },
  'distinct': map => map.set('distinct', true),
  'count': (map, op) => map.get('count').push({ field: op.field || '*' }),
  'avg': (map, op) => map.get('avg').push({ field: op.field }),
  'min': (map, op) => map.get('min').push({ field: op.field }),
  'max': (map, op) => map.get('max').push({ field: op.field }),
  'sum': (map, op) => map.get('sum').push({ field: op.field }),
  'order': (map, op) => {
    const order = map.get('orderBy');
    op.fields.forEach(field => order.add({ field, dir: 'ASC' }));
  },
  'desc': (map, op) => {
    const order = map.get('orderBy');
    op.fields.forEach(field => order.add({ field, dir: 'DESC' }));
  },
  'from': (map, name) => map.set('from', name),
  'limit': (map, op) => map.set('limit', op.count),
  'offset': (map, op) => map.set('offset', op.count),
};

class PostgresCursor extends Cursor {
  constructor(pgConnection, query, options) {
    super(options);
    this.pg = pgConnection;
    if (query) this.category = query.category;
  }

  select(query) {
    if (!this._canUseSQL()) {
      return super.select(query);
    }
    const constraints = transformations.constraints(query);
    Object.keys(constraints).forEach(key => {
      const [cond, value] = constraints[key];
      if (cond === '!') return this.sqlQuery.whereNull(key);
      return this.sqlQuery.where(key, cond, value);
    });
    return this;
  }

  order(fields) {
    if (!this._canUseSQL()) {
      return super.order(fields);
    }
    if (typeof fields === 'string') this.sqlQuery.orderBy(fields, 'ASC');
    else fields.forEach(f => this.sqlQuery.orderBy(f, 'ASC'));
    return this;
  }

  desc(fields) {
    if (!this._canUseSQL()) {
      return super.desc(fields);
    }
    if (typeof fields === 'string') this.sqlQuery.orderBy(fields, 'DESC');
    else fields.forEach(f => this.sqlQuery.orderBy(f, 'DESC'));
    return this;
  }

  _prepareJSQLToSql(category, jsql) {
    const operations = new Map();
    for (const op of Object.keys(supportedOps)) {
      const constructor = supportedOps[op];
      operations.set(op, constructor ? new constructor() : null);
    }

    jsqlToSql['from'](operations, category);

    let i = 0;
    for (; i < jsql.length; ++i) {
      const op = jsql[i];
      const handler = jsqlToSql[op.op];
      if (!handler) {
        --i;
        break;
      }
      handler(operations, op);
    }
    return [operations, i];
  }

  generateSql() {
    const [operations, handledCount] =
      this._prepareJSQLToSql(this.category, this.jsql);

    let query = 'SELECT';

    if (operations.get('selectDistinct')) query += ' DISTINCT';

    // handle initial select clause
    const select = operations.get('select');
    if (select.size > 0) {
      query += ' ' + iter(select).reduce((acc, id) => acc + ', ' + id);
    } else {
      query += ' *';
    }

    // handle operations
    for (const name of functionalHandlers) {
      const ops = operations.get(name);
      if (ops.length === 0) continue;
      else if (query.endsWith(' *')) query = query.slice(0, -2);
      else query += ',';
      const handler = jsqlToSql[name];
      // eslint-disable-next-line no-loop-func
      query += ops.reduce((acc, op) => acc + handler(op, query) + ',', ' ')
        .slice(0, -1);
    }

    // handle from
    const tableName = operations.get('from');
    if (!tableName) {
      throw new Error('Cannot generate SQL, tableName is undefined');
    }
    query += ` FROM ${tableName}`;

    // handle where clauses
    const whereClauses = operations.get('where');
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
    const groupClauses = operations.get('groupBy');
    if (groupClauses.size > 0) {
      query += ' GROUP BY ' +
        iter(groupClauses).reduce((acc, field) => acc + ', ' + field);
    }

    // handle order clauses
    const orderClauses = operations.get('orderBy');
    if (orderClauses.size > 0) {
      const clauses = iter(orderClauses);
      const firstClause = clauses.next().value;
      query += ` ORDER BY ${firstClause.field} ${firstClause.dir}`;
      for (const order of clauses) {
        query += `, ${order.field} ${order.dir}`;
      }
    }

    // handle limit and offset
    const limit = operations.get('limit');
    if (limit) query += ` LIMIT ${limit}`;

    const offset = operations.get('offset');
    if (offset) query += ` OFFSET ${offset}`;

    return [query, handledCount];
  }

  fetch(callback) {
    if (!this.category) {
      callback(new Error('Category name was not specified'));
      return;
    }

    const [sqlQuery, handledCount] = this.generateSql();
    this.jsql = this.jsql.slice(handledCount);

    this.pg.query(sqlQuery.toString(), (err, res) => {
      if (err) {
        callback(err);
        return;
      }
      if (this.jsql.length === 0) callback(null, res.rows, this);
      else this.continue(res.rows, callback);
    });
  }
}

module.exports = { PostgresCursor };
