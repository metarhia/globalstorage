'use strict';

const common = require('metarhia-common');

const transformations = require('./transformations');
const { StorageProvider } = require('./provider');
const { MongodbCursor } = require('./mongodb.cursor');

const DUPLICATE_KEY = 11000;

const constraints = defs => transformations.constraints(defs, def => {
  const c0 = def[0];
  const eq = c0 === '=';
  const nt = c0 === '!';
  if (eq || nt) {
    const val = def.substr(1).trim();
    const value = parseFloat(val) || val;
    if (eq) return value;
    if (nt) return { $ne: value };
  }
  const c1 = def[1];
  const et = c1 === '=';
  const lt = c0 === '<';
  const gt = c0 === '>';
  if (lt || gt) {
    if (et) {
      const val = def.substr(2).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lte: value };
      else return { $gte: value };
    } else {
      const val = def.substr(1).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lt: value };
      else return { $gt: value };
    }
  }
  return def;
});

function MongodbProvider() {
  StorageProvider.call(this);
  this.stat = null;
}

common.inherits(MongodbProvider, StorageProvider);

MongodbProvider.prototype.open = function(options, callback) {
  callback = common.once(callback);
  StorageProvider.prototype.open.call(this, options, () => {
    if (this.db) {
      this.storage = this.db.collection('gsStorage');
      this.metadata = this.db.collection('gsMetadata');
      this.metadata.findOne({ _id: 0 }, (err, data) => {
        if (data) {
          delete data._id;
          //this.gs.infrastructure.assign(data.tree);
          this.stat = data;
          callback();
        } else {
          const metadata = { _id: 0, next: 0, tree: {} };
          this.metadata.insertOne(metadata, callback);
        }
      });
    }
  });
};

MongodbProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  if (this.client) this.client.close(callback);
  else callback();
};

MongodbProvider.prototype.category = function(name) {
  return this.db.collection('c' + name);
};

MongodbProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  this.metadata.findAndModify(
    { _id: 0 }, null,
    { $inc: { next: 1 } },
    { upsert: true, new: true },
    (err, res) => {
      if (err) {
        if (err.code === DUPLICATE_KEY) {
          process.nextTick(() => {
            this.generateId(callback);
          });
        } else {
          callback(err);
        }
        return;
      }
      callback(null, res.value.next);
    }
  );
};

MongodbProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  this.storage.findOne({ _id: id }, (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    const category = this.category(data.category);
    category.findOne({ _id: id }, (err, data) => {
      if (data) data.id = data._id;
      callback(err, data);
    });
  });
};

MongodbProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) {
      callback(err);
      return;
    }
    obj._id = id;
    obj.id = id;
    const index = { _id: id, category: obj.category };
    this.storage.insertOne(index, (err) => {
      if (err) {
        callback(err);
        return;
      }
      const category = this.category(obj.category);
      category.insertOne(obj, (err) => {
        if (err) callback(err);
        else callback(null, id);
      });
    });
  });
};

MongodbProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  obj._id = obj.id;
  this.storage.findOne({ _id: obj._id }, (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    const category = this.category(data.category);
    category.updateOne(
      { _id: obj._id }, obj, { upsert: true, w: 1 }, callback
    );
  });
};

MongodbProvider.prototype.delete = function(query, callback) {
  callback = common.once(callback);
  const qtype = typeof(query);
  if (qtype === 'object') {
    if (query.category) {
      const category = this.category(query.category);
      category.deleteMany(query);
      this.storage.deleteMany(query, callback);
      return;
    }
  }
  if (qtype === 'number') {
    this.storage.findOne({ _id: query }, (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      const category = this.category(data.category);
      category.deleteOne({ _id: query });
      this.storage.deleteOne({ _id: query }, callback);
    });
  }
  callback(new Error('Nothing to delete'));
};

MongodbProvider.prototype.select = function(query, options, callback) {
  const category = this.category(query.category);
  const prepared = constraints(query);
  delete prepared.category;
  const cursor = category.find(prepared);
  if (callback) {
    cursor.toArray((err, data) => {
      if (err) {
        callback(err);
        return;
      }
      data.forEach((obj) => {
        obj.id = obj._id;
      });
      callback(null, data);
    });
  } else {
    const mc = new MongodbCursor(cursor);
    mc.provider = this;
    mc.jsql.push({ op: 'select', query, options });
    return mc;
  }
};

MongodbProvider.prototype.fields = (list) => {
  const fields = {};
  list.forEach(field => fields[field] = 1);
  return fields;
};

MongodbProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  const category = this.category(def.category);
  const keys = this.fields(def.fields);
  const options = {
    unique: def.unique !== undefined ? def.unique : false,
    sparse: def.nullable !== undefined ? def.nullable : false,
    background: def.background !== undefined ? def.background : true
  };
  category.createIndex(keys, options, callback);
};

module.exports = { MongodbProvider };
