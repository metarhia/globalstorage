'use strict';

var util = require('util');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var jstp = require('metarhia-jstp');
var metasync = require('metasync');

module.exports = FsProvider;
var StorageProvider = require('./provider.js');
util.inherits(FsProvider, StorageProvider);

// File System Storage Provider
//   options.path - base path
//
function FsProvider(options) {
  this.stat = null;
}

FsProvider.prototype.open = function(options, callback) {
  this.path = options.path;
  var provider = this;
  StorageProvider.prototype.open.call(this, options, function() {
    provider.readStat(function(err) {
      if (err) {
        callback(new Error('Can not open database: ' + provider.path));
      } else callback();
    });
  });
};

FsProvider.prototype.readStat = function(callback) {
  var provider = this;
  fs.readFile(this.path + '/.gs', function(err, data) {
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
  var provider = this;
  function save() {
    var data = jstp.stringify(provider.stat);
    fs.writeFile(provider.path + '/.gs', data, function(err, data) {
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
  var path = this.idToPath(id);
  fs.readFile(path, callback);
};

FsProvider.prototype.create = function(obj, callback) {
  var provider = this;
  provider.generateId(function(err, id) {
    if (err) {
      if (callback) callback(err);
    } else {
      obj.id = id;
      var data = jstp.stringify(obj);
      provider.stat.size += data.length;
      provider.writeStat();
      var place = provider.idToChunks(obj.id);
      place.path = provider.path + place.path;
      mkdirp(place.path, function(err) {
        var pp = place.path + '/' + place.name;
        fs.writeFile(pp, data, function(err) {
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
  var place = this.idToChunks(id);
  return this.path + place.path + '/' + place.name;
};

FsProvider.prototype.idToChunks = function(id) {
  var hex = id.toString(16);
  var p = hex.length % 4;
  var pad = 4 - p;
  if (p !== 0) {
    hex = new Array(pad + 1).join('0') + hex;
  }
  var bytes = hex.length / 4;
  var chunk, chunks = [];
  for (var i = 0; i < bytes; i++) {
    chunk = hex.substr(-(i + 1) * 4, 4);
    chunks.unshift(chunk);
  }
  var name = chunks.shift();
  var path = chunks.join('/');
  if (path === '') {
    path = name;
    name = '0000';
  }
  return { path: '/' + path, name: name + '.gs' };
};

FsProvider.prototype.update = function(obj, callback) {
  var provider = this;
  var path = this.idToPath(obj.id);
  fs.stat(path, function(err, stat) {
    if (err) {
      if (callback) callback(err);
    } else {
      var data = jstp.stringify(obj);
      provider.stat.size += data.length - stat.size;
      provider.writeStat();
      fs.writeFile(path, data, function(err) {
        if (err) {
          console.error(err);
        }
        if (callback) callback();
      });
    }
  });
};

FsProvider.prototype.delete = function(id, callback) {
  var provider = this;
  var path = this.idToPath(id);
  fs.stat(path, function(err, stat) {
    if (err) {
      if (callback) callback(err);
    } else {
      fs.unlink(path, function(err) {
        provider.stat.count--;
        provider.stat.size -= stat.size;
        provider.writeStat();
        if (callback) callback();
      });
    }
  });
};

FsProvider.prototype.select = function(query, options, callback) {
  callback();
};

FsProvider.prototype.index = function(def, callback) {
  callback();
};
