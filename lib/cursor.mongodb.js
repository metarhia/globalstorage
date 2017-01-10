'use strict';

const util = require('util');
const transformations = require('./transformations.js');
const NOT_IMPLEMENTED = 'Not implemented';

module.exports = MongodbCursor;
const Cursor = require('./cursor.js');
util.inherits(MongodbCursor, Cursor);

function MongodbCursor(provider, cursor) {
  this.provider = provider;
  this.cursor = cursor;
  this.jsql = [];
}

MongodbCursor.prototype.copy = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(mc);
  cursor.jstp = this.jstp;
  return cursor;
};

MongodbCursor.prototype.clone = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(mc);
  cursor.jstp = this.jstp;
  return cursor;
};

MongodbCursor.prototype.enroll = function(jsql) {
  return this;
};

MongodbCursor.prototype.empty = function() {
  return this;
};

MongodbCursor.prototype.from = function(arr) {
  return new Error(NOT_IMPLEMENTED);
};

MongodbCursor.prototype.map = function(fn) {
  this.cursor.map(fn);
  this.jsql.push({ op: 'map', fn });
  return this;
};

MongodbCursor.prototype.projection = function(mapping) {
  if (Array.isArray(mapping)) {
    const fields = {};
    mapping.forEach(field => fields[field] = 1);
    this.cursor.project(fields);
    this.jsql.push({ op: 'projection', fields: mapping });
  } else {
    this.jsql.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

MongodbCursor.prototype.filter = function(fn) {
  this.jsql.push({ op: 'filter', fn });
  return this;
};

MongodbCursor.prototype.select = function(query) {
  this.cursor.filter(query);
  this.jsql.push({ op: 'select', query });
  return this;
};

MongodbCursor.prototype.distinct = function() {
  this.jsql.push({ op: 'distinct' });
  return this;
};

MongodbCursor.prototype.find = function(fn) {
  this.jsql.push({ op: 'find', fn });
  return this;
};

MongodbCursor.prototype.sort = function(fn) {
  this.jsql.push({ op: 'sort', fn });
  return this;
};

MongodbCursor.prototype.order = function(fields) {
  const order = {};
  if (typeof(fields) === 'string') {
    order[fields] = 1;
    this.cursor.sort(order);
    this.jsql.push({ op: 'order', fields: [fields] });
  } else {
    fields.forEach(field => order[field] = 1);
    this.cursor.sort(order);
    this.jsql.push({ op: 'order', fields });
  }
  return this;
};

MongodbCursor.prototype.desc = function(fields) {
  const order = {};
  if (typeof(fields) === 'string') {
    order[fields] = -1;
    this.cursor.sort(order);
    this.jsql.push({ op: 'desc', fields: [fields] });
  } else {
    fields.forEach(field => order[field] = -1);
    this.cursor.sort(order);
    this.jsql.push({ op: 'desc', fields });
  }
  return this;
};

MongodbCursor.prototype.count = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.sum = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.avg = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.max = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.min = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.median = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.mode = function(done) {
  done(new Error(NOT_IMPLEMENTED));
  return this;
};

MongodbCursor.prototype.limit = function(n) {
  this.cursor.limit(n);
  this.jsql.push({ op: 'limit', count: n });
  return this;
};

MongodbCursor.prototype.modify = function(changes, done) {
  const mc = this;
  if (mc.jsql.length > 0) {
    const select = mc.jsql[0];
    if (select.op === 'select') {
      const category = this.provider.category(select.query.category);
      category.updateMany(select.query, { $set: changes }, { w: 1 }, done);
    }
  }
};

MongodbCursor.prototype.fetch = function(done) {
  const mc = this;
  mc.cursor.toArray((err, data) => {
    if (err) done(err);
    else {
      mc.jsql.forEach((item) => {
        if (item.op === 'projection') {
          data = transformations.projection(item.fields, data);
        } else if (item.op === 'row') {
          data = transformations.row(data);
        } else if (item.op === 'col') {
          data = transformations.col(data);
        } else if (item.op === 'one') {
          data = data[0];
        } else if (item.op === 'union') {
          item.cursor.fetch((err, data2) => {
            data = data.concat(data2);
          });
        }
      });
      done(null, data);
      mc.jsql = {}; // TODO
    }
  });
  return this;
};

MongodbCursor.prototype.next = function(done) {
  const mc = this;
  mc.cursor.nextObject((err, record) => {
    if (err) done(err);
    else {
      let data = [record];
      mc.jsql.forEach((item) => {
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
      mc.jsql = {};
    }
  });
  return this;
};
