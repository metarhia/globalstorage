'use strict';

const util = require('util');
const fs = require('fs');
const mkdirp = require('mkdirp');
const jstp = require('metarhia-jstp');
const metasync = require('metasync');

module.exports = FsProvider;
const StorageProvider = require('./provider.js');
util.inherits(FsProvider, StorageProvider);

function FsProvider(
  options // { path } where path is database base path
) {
  this.stat = null;
  this.options = options;
}

FsProvider.prototype.open = function(options, callback) {
  this.path = options.path;
  const provider = this;
  StorageProvider.prototype.open.call(this, options, () => {
    provider.readStat((err) => {
      if (err) {
        callback(new Error('Can not open database: ' + provider.path));
      } else callback();
    });
  });
};

FsProvider.prototype.readStat = function(callback) {
  const provider = this;
  fs.readFile(this.path + '/.gs', (err, data) => {
    if (err) callback(err);
    else {
      data = jstp.parse(data.toString());
      data.count = data.count || 0;
      data.size = data.size || 0;
      data.next = data.next || 1;
      provider.stat = data;
      callback();
    }
  });
};

FsProvider.prototype.writeStat = function() {
  const provider = this;
  function save() {
    const data = jstp.stringify(provider.stat);
    fs.writeFile(provider.path + '/.gs', data, (err) => {
      if (!err) {
        console.log('written');
      }
    });
  }
  this.save = provider.save || metasync.throttle(5000, save);
  this.save();
};

FsProvider.prototype.close = function(callback) {
  this.writeStat();
  callback();
};

FsProvider.prototype.category = function(name) {
  return {};
};

FsProvider.prototype.generateId = function(callback) {
  callback(null, this.stat.next++);
  this.stat.count++;
  this.writeStat();
};

FsProvider.prototype.get = function(id, callback) {
  const path = this.idToPath(id);
  fs.readFile(path, (err, data) => {
    callback(err, jstp.parse(data.toString()));
  });
};

FsProvider.prototype.create = function(obj, callback) {
  const provider = this;
  provider.generateId((err, id) => {
    if (err) {
      if (callback) callback(err);
    } else {
      obj.id = id;
      const data = jstp.stringify(obj);
      provider.stat.size += data.length;
      provider.writeStat();
      const place = provider.idToChunks(obj.id);
      place.path = provider.path + place.path;
      mkdirp(place.path, (err) => {
        const pp = place.path + '/' + place.name;
        fs.writeFile(pp, data, (err) => {
          if (err) {
            console.error(err);
          }
          if (callback) callback();
        });
      });
    }
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
  const provider = this;
  const path = this.idToPath(obj.id);
  fs.stat(path, (err, stat) => {
    if (err) {
      if (callback) callback(err);
    } else {
      const data = jstp.stringify(obj);
      provider.stat.size += data.length - stat.size;
      provider.writeStat();
      fs.writeFile(path, data, (err) => {
        if (err) {
          console.error(err);
        }
        if (callback) callback();
      });
    }
  });
};

FsProvider.prototype.delete = function(id, callback) {
  const provider = this;
  const path = this.idToPath(id);
  fs.stat(path, (err, stat) => {
    if (err) {
      if (callback) callback(err);
    } else {
      fs.unlink(path, (err) => {
        provider.stat.count--;
        provider.stat.size -= stat.size;
        provider.writeStat();
        if (callback) callback();
      });
    }
  });
};

FsProvider.prototype.select = function(query, options, callback) {
  const provider = this;
  if (callback) callback();
};

FsProvider.prototype.index = function(def, callback) {
  callback();
};