'use strict';

const { extractDecorator } = require('metaschema');

const transformations = require('./transformations');
const { SelectBuilder, PostgresParamsBuilder } = require('@metarhia/sql');
const { Cursor } = require('./cursor');
const { fitInSchema } = require('./pg.utils');
const { GSError, codes: errorCodes } = require('./errors');

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
    Array.isArray(op.fields) && query.select(...op.fields),
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

  async fetch(permissionChecker) {
    if (!this.category) {
      throw new TypeError('Category name was not specified');
    }
    const paramsBuilder = new PostgresParamsBuilder();
    const pgquery = new SelectBuilder(paramsBuilder).from(this.category);
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

    if (permissionChecker) {
      await permissionChecker(this.category, {
        record: fullQuery,
        isQuery: true,
      });
    }

    // TODO: use array mode here, to avoid possible name collisions when
    //       querying from multiple tables at once
    try {
      const res = await this.pg.query(pgquery.build(), paramsBuilder.build());
      this.jsql = this.jsql.slice(i);
      const rows = hasInclude
        ? res.rows.map(row => fitInSchema(row, schema))
        : res.rows;

      if (this.jsql.length === 0) return rows;
      else return this.continue(rows);
    } catch (err) {
      this.provider.systemLogger(err);
      throw new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err);
    }
  }
}

module.exports = { PostgresCursor };
