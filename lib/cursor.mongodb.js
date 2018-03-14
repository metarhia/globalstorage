'use strict';

const util = require('util');
const common = require('metarhia-common');
const transformations = require('./transformations');
const Cursor = require('./cursor');

function MongodbCursor(provider, cursor) {
  this.provider = provider;
  this.cursor = cursor;
  this.jsql = [];
}

util.inherits(MongodbCursor, Cursor);

MongodbCursor.fields = list => {
  const fields = {};
  list.forEach(field => fields[field] = 1);
  return fields;
};

MongodbCursor.prototype.copy = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(this.provider, mc);
  cursor.jsql = [...this.jsql];
  return cursor;
};

MongodbCursor.prototype.clone = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(this.provider, mc);
  cursor.jsql = this.jsql;
  return cursor;
};

MongodbCursor.prototype.enroll = function(jsql) {
  console.dir(jsql);
  return this;
};

MongodbCursor.prototype.modify = function(changes, done) {
  done = common.once(done);
  if (this.jsql.length > 0) {
    const select = this.jsql[0];
    if (select.op === 'select') {
      const category = this.provider.category(select.query.category);
      category.updateMany(select.query, { $set: changes }, { w: 1 }, done);
    }
  }
};

MongodbCursor.prototype.fetch = function(done) {
  done = common.once(done);
  this.cursor.toArray((err, data) => {
    if (err) {
      done(err);
      return;
    }
    this.jsql.forEach((item) => {
      if (item.op === 'projection') {
        data = transformations.projection(item.fields, data);
      } else if (item.op === 'row') {
        data = transformations.row(data);
      } else if (item.op === 'col') {
        data = transformations.col(data, item.field);
      } else if (item.op === 'one') {
        data = data[0];
      } else if (item.op === 'distinct') {
        const keys = new Set();
        let fields = item.fields;
        if (typeof(fields) === 'string') fields = [fields];
        data = data.filter((record) => {
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
    this.jsql = {};
  });
  return this;
};

MongodbCursor.prototype.next = function(done) {
  done = common.once(done);
  this.cursor.nextObject((err, record) => {
    if (err) {
      done(err);
      return;
    }
    let data = [record];
    this.jsql.forEach((item) => {
      if (item.op === 'projection') {
        data = transformations.projection(item.fields, data);
      } else if (item.op === 'row') {
        data = transformations.row(data);
      } else if (item.op === 'col') {
        data = transformations.col(data);
      } else if (item.op === 'one') {
        data = data[0];
      }
    });
    done(null, data[0]);
    this.jsql = {};
  });
  return this;
};

module.exports = MongodbCursor;
