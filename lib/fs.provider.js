'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const common = require('metarhia-common');
const metasync = require('metasync');
const jstp = require('metarhia-jstp');

const StorageProvider = require('./provider');

const THROTTLE_TIMEOUT = 5000;

function FsProvider(
  options // { path } where path is database base path
) {
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
    const data = jstp.parse(stat.toString());
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

FsProvider.prototype.writeStat = function() {
  const save = () => {
    const data = jstp.stringify(this.stat);
    fs.writeFile(this.path + '/.gs', data, (err) => {
      if (!err) console.log('written');
    });
  };
  this.save = this.save || metasync.throttle(THROTTLE_TIMEOUT, save);
  this.save();
};

FsProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  this.writeStat();
  callback();
};

FsProvider.prototype.category = function(name) {
  return { name };
};

FsProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  callback(null, this.stat.next++);
  this.stat.count++;
  this.writeStat();
};

FsProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  const path = this.idToPath(id);
  fs.readFile(path, (err, data) => {
    if (err) callback(err);
    else callback(null, jstp.parse(data.toString()));
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
    const data = jstp.stringify(obj);
    this.stat.size += data.length;
    this.writeStat();
    const place = this.idToChunks(obj.id);
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

FsProvider.prototype.idToPath = function(id) {
  const place = this.idToChunks(id);
  return this.path + place.path + '/' + place.name;
};

FsProvider.prototype.idToChunks = function(id) {
  let hex = id.toString(16);
  const p = hex.length % 4;
  const pad = 4 - p;
  if (p !== 0) {
    hex = new Array(pad + 1).join('0') + hex;
  }
  const bytes = hex.length / 4;
  const chunks = [];
  let i, chunk;
  for (i = 0; i < bytes; i++) {
    chunk = hex.substr(-(i + 1) * 4, 4);
    chunks.unshift(chunk);
  }
  let name = chunks.shift();
  let path = chunks.join('/');
  if (path === '') {
    path = name;
    name = '0000';
  }
  return { path: '/' + path, name: name + '.gs' };
};

FsProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  const path = this.idToPath(obj.id);
  fs.stat(path, (err, stat) => {
    if (err) {
      callback(err);
      return;
    }
    const data = jstp.stringify(obj);
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
  const path = this.idToPath(id);
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
  callback = common.once(callback);
  callback();
};

FsProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  callback();
};

module.exports = FsProvider;
