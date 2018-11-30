'use strict';

const { extractDecorator } = require('metaschema');

const transformations = require('./transformations');
const { SelectBuilder } = require('./sqlgen');
const { Cursor } = require('./cursor');
const { fitInSchema } = require('./pg.utils');

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
  constructor(provider, options) {
    super(options);
    this.provider = provider;
    this.pg = provider.pool;
  }

  fetch(callback) {
    if (!this.category) {
      throw new TypeError('Category name was not specified');
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

    // add inner joins for Include fields
    let hasInclude = false;
    let schema;
    if (this.provider.gs.schema.categories.has(this.category)) {
      schema = this.provider.gs.schema
        .categories.get(this.category)
        .definition;

      for (const key in schema) {
        const field = schema[key];
        if (extractDecorator(field) === 'Include') {
          const cat = field.category;
          pgquery.innerJoin(cat, `${this.category}.Id`, `${cat}.Id`);
          hasInclude = true;
        }
      }
    }

    // TODO: use array mode here, to avoid possible name collisions when
    //       querying from multiple tables at once
    this.pg.query(...pgquery.build(), (err, res) => {
      if (err) {
        callback(err);
        return;
      }
      this.jsql = this.jsql.slice(i);
      const rows = hasInclude ?
        res.rows.map(row => fitInSchema(row, schema)) : res.rows;

      if (this.jsql.length === 0) callback(null, rows, this);
      else this.continue(rows, callback);
    });
  }
}

module.exports = { PostgresCursor };
