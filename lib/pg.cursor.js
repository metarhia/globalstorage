'use strict';

const transformations = require('./transformations');
const { SelectBuilder } = require('./sqlgen');
const { Cursor } = require('./cursor');

class PostgresCursor extends Cursor {
  constructor(pgConnection, query, options) {
    super(options);
    this.pg = pgConnection;
    this.sqlQuery = new SelectBuilder();
    if (query) this.category = query.category;
  }

  _canUseSQL() {
    return this.jsql.length === 0;
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

  distinct() {
    this.sqlQuery.distinct();
    return this;
  }

  limit(count) {
    if (!this._canUseSQL()) {
      return super.limit(count);
    }
    this.sqlQuery.limit(count);
    return this;
  }

  offset(count) {
    if (!this._canUseSQL()) {
      return super.offset(count);
    }
    this.sqlQuery.offset(count);
    return this;
  }

  count(field) {
    if (!this._canUseSQL()) {
      return super.count(field);
    }
    this.sqlQuery.count(field);
    return this;
  }

  sum(field) {
    if (!this._canUseSQL()) {
      return super.sum(field);
    }
    this.sqlQuery.sum(field);
    return this;
  }

  avg(field) {
    if (!this._canUseSQL()) {
      return super.avg(field);
    }
    this.sqlQuery.avg(field);
    return this;
  }

  max(field) {
    if (!this._canUseSQL()) {
      return super.max(field);
    }
    this.sqlQuery.max(field);
    return this;
  }

  min(field) {
    if (!this._canUseSQL()) {
      return super.min(field);
    }
    this.sqlQuery.min(field);
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

  fetch(callback) {
    if (!this.category) {
      callback(new Error('Category name was not specified'));
      return;
    }
    this.sqlQuery.from(this.category);
    this.pg.query(this.sqlQuery.toString(), (err, res) => {
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
