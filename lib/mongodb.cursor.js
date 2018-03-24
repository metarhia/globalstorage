'use strict';

const common = require('metarhia-common');

const transformations = require('./transformations');
const operations = require('./operations');
const { Cursor } = require('./cursor');

function MongodbCursor(cursor) {
  MongodbCursor.super_.call(this);
  this.cursor = cursor;
}

common.inherits(MongodbCursor, Cursor);

MongodbCursor.prototype.clone = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(mc);
  cursor.provider = this.provider;
  cursor.parent = this.parent;
  cursor.jsql = common.clone(this.jsql);
  return cursor;
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
  this.cursor.toArray((err, dataset) => {
    if (err) {
      done(err);
      return;
    }
    this.jsql.forEach(operation => {
      const fn = operations[operation.op];
      if (fn) {
        dataset = fn(operation, dataset);
      }
    });
    this.jsql.length = 0;
    done(null, dataset);
    return this;
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
  });
  return this;
};

module.exports = { MongodbCursor };
