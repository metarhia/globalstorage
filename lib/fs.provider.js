'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const common = require('metarhia-common');
const metasync = require('metasync');
const mdsf = require('mdsf');

const { StorageProvider } = require('./provider');
const { FsCursor } = require('./fs.cursor');

const THROTTLE_TIMEOUT = 5000;

function FsProvider(
  options // { path } where path is database location
) {
  StorageProvider.call(this);
  this.stat = null;
  this.options = options;
}

common.inherits(FsProvider, StorageProvider);

FsProvider.prototype.readStat = function(callback) {
  fs.readFile(this.path + '/.gs', (err, stat) => {
    if (err) {
      callback(err);
      return;
    }
    const data = mdsf.parse(stat.toString());
    data.count = data.count || 0;
    data.size = data.size || 0;
    data.next = data.next || 1;
    callback(null, data);
  });
};

FsProvider.prototype.open = function(options, callback) {
  callback = common.once(callback);
  this.path = options.path;
  StorageProvider.prototype.open.call(this, options, () => {
    this.readStat((err, stat) => {
      if (err) {
        callback(new Error('Can not open database: ' + this.path));
      } else {
        this.stat = stat;
        callback();
      }
    });
  });
};

FsProvider.prototype.writeStat = function(callback) {
  callback = common.once(callback);
  const save = () => {
    const data = mdsf.stringify(this.stat);
    fs.writeFile(this.path + '/.gs', data, callback);
  };
  this.save = this.save || metasync.throttle(THROTTLE_TIMEOUT, save);
  this.save();
};

FsProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  this.writeStat();
  callback();
};

FsProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  callback(null, this.stat.next++);
  this.stat.count++;
  this.writeStat();
};

FsProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  const path = common.idToPath(id);
  fs.readFile(path, (err, data) => {
    if (err) callback(err);
    else callback(null, mdsf.parse(data.toString()));
  });
};

FsProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) {
      callback(err);
      return;
    }
    obj.id = id;
    const data = mdsf.stringify(obj);
    this.stat.size += data.length;
    this.writeStat();
    const place = common.idToChunks(obj.id);
    place.path = this.path + place.path;
    mkdirp(place.path, (err) => {
      if (err) {
        callback(err);
        return;
      }
      const pp = place.path + '/' + place.name;
      fs.writeFile(pp, data, (err) => {
        if (err) callback(err);
        else callback(null, id);
      });
    });
  });
};

FsProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  const path = common.idToPath(obj.id);
  fs.stat(path, (err, stat) => {
    if (err) {
      callback(err);
      return;
    }
    const data = mdsf.stringify(obj);
    this.stat.size += data.length - stat.size;
    this.writeStat();
    fs.writeFile(path, data, (err) => {
      if (err) callback(err);
      else callback();
    });
  });
};

FsProvider.prototype.delete = function(id, callback) {
  callback = common.once(callback);
  const path = common.idToPath(id);
  fs.stat(path, (err, stat) => {
    if (err) {
      callback(err);
      return;
    }
    fs.unlink(path, (err) => {
      if (err) {
        callback(err);
        return;
      }
      this.stat.count--;
      this.stat.size -= stat.size;
      this.writeStat();
      callback();
    });
  });
};

FsProvider.prototype.select = function(query, options, callback) {
  if (callback) callback();
  const fc = new FsCursor();
  fc.provider = this;
  fc.jsql.push({ op: 'select', query, options });
  return fc;
};

FsProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  callback();
};

module.exports = { FsProvider };
