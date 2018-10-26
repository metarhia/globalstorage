'use strict';

const transformations = require('./transformations');
const { SelectBuilder } = require('./sqlgen');
const { Cursor } = require('./cursor');

const jsqlToSQLConverters = {
  select: (op, query) => {
    const constraints = transformations.constraints(op.query);
    Object.keys(constraints).forEach(key => {
      const [cond, value] = constraints[key];
      if (cond === '!') return query.where(key, '!=', value);
      return query.where(key, cond, value);
    });
  },
  distinct: (op, query) => query.distinct(),
  limit: (op, query) => query.limit(op.count),
  offset: (op, query) => query.offset(op.offset),
  count: (op, query) => query.count(),
  sum: (op, query) => query.sum(op.field),
  avg: (op, query) => query.avg(op.field),
  max: (op, query) => query.max(op.field),
  min: (op, query) => query.min(op.field),
  order: (op, query) => op.fields.forEach(f => query.orderBy(f, 'ASC')),
  desc: (op, query) => op.fields.forEach(f => query.orderBy(f, 'DESC')),
};

class PostgresCursor extends Cursor {
  constructor(pgConnection, options) {
    super(options);
    this.pg = pgConnection;
  }

  fetch(callback) {
    if (!this.category) {
      callback(new Error('Category name was not specified'));
      return;
    }
    const pgquery = new SelectBuilder()
      .from(this.category);

    let i = 0;
    for (; i < this.jsql.length; ++i) {
      const op = this.jsql[i];
      const conv = jsqlToSQLConverters[op.op];
      if (!conv) {
        --i;
        break;
      }
      conv(op, pgquery, i, this);
    }
    this.pg.query(...pgquery.build(), (err, res) => {
      if (err) {
        callback(err);
        return;
      }
      this.jsql = this.jsql.slice(i);
      if (this.jsql.length === 0) callback(null, res.rows, this);
      else this.continue(res.rows, callback);
    });
  }
}

module.exports = { PostgresCursor };
