'use strict';

module.exports = (api) => {

  api.gs.MemoryCursor = MemoryCursor;
  api.util.inherits(MemoryCursor, api.gs.Cursor);

  function MemoryCursor(provider, dataset) {
    this.provider = provider;
    this.dataset = dataset;
    this.jsql = [];
    this.index = {};
  }

  MemoryCursor.prototype.copy = function() {
    const ds = api.common.copy(this.dataset);
    return new MemoryCursor(this.provider, ds);
  };

  MemoryCursor.prototype.clone = function() {
    const ds = api.common.clone(this.dataset);
    return new MemoryCursor(this.provider, ds);
  };

  MemoryCursor.prototype.enroll = function(jsql) {
    this.jsql = jsql;
    return this;
  };

  MemoryCursor.prototype.empty = function() {
    this.dataset = [];
    this.jsql = [];
    return this;
  };

  MemoryCursor.prototype.from = function(arr) {
    this.dataset = api.common.clone(arr);
    return this;
  };

  MemoryCursor.prototype.map = function(fn, immediate) {
    if (immediate) {
      this.dataset = this.dataset.map(fn);
    } else {
      this.jsql.push({ op: 'map', fn });
    }
    return this;
  };

  MemoryCursor.prototype.projection = function(mapping, immediate) {
    if (immediate) {
      this.dataset = api.gs.transformations.projection(mapping);
    } else {
      this.jsql.push({ op: 'projection', fields: mapping });
    }
    return this;
  };

  MemoryCursor.prototype.filter = function(fn, immediate) {
    if (immediate) {
      this.dataset = this.dataset.filter(fn);
    } else {
      this.jsql.push({ op: 'find', fn });
    }
    return this;
  };

  MemoryCursor.prototype.select = function(
    query, // declarative query
    immediate // bool, default false
  ) {
    if (immediate) {
      const fields = Object.keys(query);
      this.dataset = this.dataset.filter(record => {
        let keep = true;
        let i, j, field, conditions, condition;
        for (i = 0; i < fields.length; i++) {
          field = fields[i];
          condition = query[field];
          if (Array.isArray(condition[0])) {
            conditions = condition;
            for (j = 0; j < conditions.length; j++) {
              condition = conditions[j];
              keep = (
                keep &&
                api.gs.transformations.compare(record, field, condition)
              );
            }
          } else {
            keep = (
              keep &&
              api.gs.transformations.compare(record, field, condition)
            );
          }
        }
        return keep;
      });
    } else {
      this.jsql.push({ op: 'select', query });
    }
    return this;
  };

  MemoryCursor.prototype.distinct = function(
    fields, // string or array of strings
    immediate // bool, default false
  ) {
    const keys = new Set();
    if (typeof(fields) === 'string') fields = [fields];
    if (immediate) {
      this.dataset = this.dataset.filter(record => {
        const cols = fields || Object.keys(record).sort();
        const key = cols.map(field => record[field]).join('\x00');
        const has = keys.has(key);
        keys.add(key);
        return !has;
      });
    } else {
      this.jsql.push({ op: 'distinct', fields });
    }
    return this;
  };

  MemoryCursor.prototype.find = function(fn, immediate) {
    if (immediate) {
      this.dataset = [this.dataset.find(fn)];
    } else {
      this.jsql.push({ op: 'find', fn });
    }
    return this;
  };

  MemoryCursor.prototype.sort = function(fn, immediate) {
    if (immediate) {
      this.dataset.sort(fn);
    } else {
      this.jsql.push({ op: 'sort', fn });
    }
    return this;
  };

  MemoryCursor.prototype.order = function(fields, immediate) {
    if (typeof(fields) === 'string') fields = [fields];
    if (immediate) {
      this.dataset.sort((r1, r2) => {
        const a1 = fields.map(field => r1[field]).join('\x00');
        const a2 = fields.map(field => r2[field]).join('\x00');
        /**/ if (a1 < a2) return -1;
        else if (a1 > a2) return 1;
        else return 0;
      });
    } else {
      this.jsql.push({ op: 'order', fields });
    }
    return this;
  };

  MemoryCursor.prototype.desc = function(fields, immediate) {
    if (typeof(fields) === 'string') fields = [fields];
    if (immediate) {
      this.dataset.sort((r1, r2) => {
        const a1 = fields.map(field => r1[field]).join('\x00');
        const a2 = fields.map(field => r2[field]).join('\x00');
        /**/ if (a1 < a2) return 1;
        else if (a1 > a2) return -1;
        else return 0;
      });
    } else {
      this.jsql.push({ op: 'desc', fields });
    }
    return this;
  };

  MemoryCursor.prototype.count = function(
    done // callback on done function(err, count)
  ) {
    done = api.common.cb(done);
    done(null, this.dataset.length);
    return this;
  };

  MemoryCursor.prototype.sum = function(
    done // callback on done function(err, sum)
  ) {
    done = api.common.cb(done);
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

  MemoryCursor.prototype.avg = function(
    done // callback on done function(err, avg)
  ) {
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

  MemoryCursor.prototype.max = function(
    done // callback on done function(err, max)
  ) {
    done = api.common.cb(done);
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

  MemoryCursor.prototype.min = function(
    done // callback on done function(err, min)
  ) {
    done = api.common.cb(done);
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

  MemoryCursor.prototype.median = function(
    done // callback on done function(err, median)
  ) {
    done = api.common.cb(done);
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

  MemoryCursor.prototype.mode = function(
    done // callback on done function(err, mode)
  ) {
    done = api.common.cb(done);
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

  MemoryCursor.prototype.col = function(
    // Convert column of dataset to Cursor
  ) {
    this.jsql.push({ op: 'col' });
    return this;
  };

  MemoryCursor.prototype.row = function(
    // Convert first row of dataset to Cursor
  ) {
    this.jsql.push({ op: 'row' });
    return this;
  };

  MemoryCursor.prototype.one = function() {
    this.jsql.push({ op: 'one' });
    return this;
  };

  MemoryCursor.prototype.limit = function(n) {
    this.jsql.push({ op: 'limit', count: n });
    return this;
  };

  MemoryCursor.prototype.union = function(cursor) {
    this.jsql.push({ op: 'union', cursor });
    return this;
  };

  MemoryCursor.prototype.intersection = function(cursor) {
    this.jsql.push({ op: 'intersection', cursor });
    return this;
  };

  MemoryCursor.prototype.difference = function(cursor) {
    this.jsql.push({ op: 'difference', cursor });
    return this;
  };

  MemoryCursor.prototype.complement = function(cursor) {
    this.jsql.push({ op: 'complement', cursor });
    return this;
  };

  MemoryCursor.prototype.fetch = function(done) {
    done = api.common.cb(done);
    const mc = this;
    let data = api.common.clone(this.dataset);
    mc.jsql.forEach((item) => {
      if (item.op === 'projection') {
        data = api.gs.transformations.projection(item.fields, data);
      } else if (item.op === 'row') {
        data = api.gs.transformations.row(data);
      } else if (item.op === 'col') {
        data = api.gs.transformations.col(data, item.field);
      } else if (item.op === 'one') {
        data = data[0];
      } else if (item.op === 'distinct') {
        const keys = new Set();
        let fields = item.fields;
        if (typeof(fields) === 'string') fields = [fields];
        data = data.filter(record => {
          const cols = fields || Object.keys(record).sort();
          const key = cols.map(field => record[field]).join('\x00');
          const has = keys.has(key);
          keys.add(key);
          return !has;
        });
      } else if (item.op === 'union') {
        item.cursor.fetch((err, data2) => {
          data = data.concat(data2);
        });
      }
    });
    done(null, data);
    mc.jsql = {};
    return this;
  };

  MemoryCursor.prototype.next = function(done) {
    done = api.common.cb(done);
    done(new Error(api.gs.NOT_IMPLEMENTED));
    return this;
  };

};
