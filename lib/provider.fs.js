'use strict';

const util = require('util');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const jstp = require('metarhia-jstp');
const metasync = require('metasync');

module.exports = FsProvider;
const StorageProvider = require('./provider.js');
util.inherits(FsProvider, StorageProvider);

// File System Storage Provider
//   options.path - base path
//
function FsProvider(options) {
  this.stat = null;
}

FsProvider.prototype.open = function(options, callback) {
  this.path = options.path;
  let provider = this;
  StorageProvider.prototype.open.call(this, options, () => {
    provider.readStat((err) => {
      if (err) {
        callback(new Error('Can not open database: ' + provider.path));
      } else callback();
    });
  });
};

FsProvider.prototype.readStat = function(callback) {
  let provider = this;
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
  let provider = this;
  function save() {
    let data = jstp.stringify(provider.stat);
    fs.writeFile(provider.path + '/.gs', data, (err, data) => {
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
  let path = this.idToPath(id);
  fs.readFile(path, (err, data) => {
    callback(err, jstp.parse(data.toString()));
  });
};

FsProvider.prototype.create = function(obj, callback) {
  let provider = this;
  provider.generateId((err, id) => {
    if (err) {
      if (callback) callback(err);
    } else {
      obj.id = id;
      let data = jstp.stringify(obj);
      provider.stat.size += data.length;
      provider.writeStat();
      let place = provider.idToChunks(obj.id);
      place.path = provider.path + place.path;
      mkdirp(place.path, (err) => {
        let pp = place.path + '/' + place.name;
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
  let place = this.idToChunks(id);
  return this.path + place.path + '/' + place.name;
};

FsProvider.prototype.idToChunks = function(id) {
  let hex = id.toString(16);
  let p = hex.length % 4;
  let pad = 4 - p;
  if (p !== 0) {
    hex = new Array(pad + 1).join('0') + hex;
  }
  let bytes = hex.length / 4;
  let chunk, chunks = [];
  for (let i = 0; i < bytes; i++) {
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
  let provider = this;
  let path = this.idToPath(obj.id);
  fs.stat(path, (err, stat) => {
    if (err) {
      if (callback) callback(err);
    } else {
      let data = jstp.stringify(obj);
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
  let provider = this;
  let path = this.idToPath(id);
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
  let provider = this;
  if (callback) callback();
};

FsProvider.prototype.index = function(def, callback) {
  callback();
};
