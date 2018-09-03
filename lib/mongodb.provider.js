'use strict';

const common = require('metarhia-common');

const { StorageProvider } = require('./provider');
const { MongodbCursor } = require('./mongodb.cursor');
const { constraints, fieldsToHash } = require('./mongodb.utils');

const DUPLICATE_KEY = 11000;

class MongodbProvider extends StorageProvider {
  constructor() {
    super();
    this.stat = null;
  }

  open(options, callback) {
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
  }

  close(callback) {
    callback = common.once(callback);
    if (this.client) this.client.close(callback);
    else callback();
  }

  category(name) {
    return this.db.collection('c' + name);
  }

  generateId(callback) {
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
  }

  get(id, callback) {
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
  }

  create(obj, callback) {
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
  }

  update(obj, callback) {
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
  }

  delete(query, callback) {
    callback = common.once(callback);
    const qtype = typeof query;
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
  }

  select(query, options, callback) {
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
  }

  index(def, callback) {
    callback = common.once(callback);
    const category = this.category(def.category);
    const keys = fieldsToHash(def.fields);
    const options = {
      unique: def.unique !== undefined ? def.unique : false,
      sparse: def.nullable !== undefined ? def.nullable : false,
      background: def.background !== undefined ? def.background : true
    };
    category.createIndex(keys, options, callback);
  }
}

module.exports = { MongodbProvider };
