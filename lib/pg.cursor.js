'use strict';

const { extractDecorator } = require('metaschema');

const transformations = require('./transformations');
const { SelectBuilder } = require('./sqlgen');
const { Cursor } = require('./cursor');
const { fitInSchema } = require('./pg.utils');
const { GSError, codes: errorCodes } = require('./errors');
const { runIfFn } = require('./utils');

const jsqlToSQLConverters = {
  select: (op, query) => {
    const constraints = transformations.constraints(op.query);
    Object.keys(constraints).forEach(key => {
      const [cond, value] = constraints[key];
      if (cond === '!') return query.where(key, '!=', value);
      return query.where(key, cond, value);
    });
  },
  projection: (op, query) =>
    Array.isArray(op.fields) ? query.select(...op.fields) : false,
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

  fetch(callback, permissionChecker) {
    if (!this.category) {
      throw new TypeError('Category name was not specified');
    }
    const pgquery = new SelectBuilder().from(this.category);
    const fullQuery = {};

    let i = 0;
    for (; i < this.jsql.length; ++i) {
      const op = this.jsql[i];
      const conv = jsqlToSQLConverters[op.op];
      if (!conv || conv(op, pgquery, i, this) === false) {
        --i;
        break;
      }
      if (op.op === 'select') {
        Object.assign(fullQuery, op.query);
      }
    }

    // add inner joins for Include fields
    const schema = this.provider.schema.categories.get(this.category)
      .definition;

    let hasInclude = false;
    for (const key in schema) {
      const field = schema[key];
      if (extractDecorator(field) === 'Include') {
        const cat = field.category;
        pgquery.innerJoin(cat, `${this.category}.Id`, `${cat}.Id`);
        hasInclude = true;
      }
    }

    runIfFn(
      permissionChecker,
      this.category,
      { record: fullQuery, isQuery: true },
      err => {
        if (err) {
          callback(err);
          return;
        }

        // TODO: use array mode here, to avoid possible name collisions when
        //       querying from multiple tables at once
        this.pg.query(...pgquery.build(), (err, res) => {
          if (err) {
            this.provider.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
            return;
          }
          this.jsql = this.jsql.slice(i);
          const rows = hasInclude
            ? res.rows.map(row => fitInSchema(row, schema))
            : res.rows;

          if (this.jsql.length === 0) callback(null, rows, this);
          else this.continue(rows, callback);
        });
      }
    );
  }
}

module.exports = { PostgresCursor };
