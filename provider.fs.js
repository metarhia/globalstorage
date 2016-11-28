'use strict';

var util = require('util');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var jstp = require('metarhia-jstp');

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
  var data = jstp.stringify(this.stat);
  fs.writeFile(this.path + '.gs', data);
  /*, function(err, data) {
    if (!err) {
      console.log('written');
    }
  });*/
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
};

FsProvider.prototype.get = function(id, callback) {
  callback();
};

FsProvider.prototype.create = function(obj, callback) {
  var provider = this;
  provider.generateId(function(err, id) {
    if (err) callback(err);
    else {
      obj.id = id;
      var data = jstp.stringify(obj);
      var place = provider.idToPath(obj.id);
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
  var hex = id.toString(16);
  var p = hex.length % 4;
  var pad = 4 - p;
  if (p !== 0) {
    hex = new Array(pad+1).join('0') + hex;
  }
  var bytes = hex.length / 4;
  var chunk, chunks = [];
  for (var i = 0; i < bytes; i++) {
    chunk = hex.substr(-(i+1)*4, 4);
    chunks.unshift(chunk);
  }
  var name = chunks.shift() + '.gs';
  var path = chunks.join('/');
  if (path !== '') path = '/' + path;
  return { path: path, name: name };
}

FsProvider.prototype.update = function(obj, callback) {
  callback();
};

FsProvider.prototype.delete = function(id, callback) {
  callback();
};

FsProvider.prototype.find = function(query, options, callback) {
  callback();
};

FsProvider.prototype.index = function(def, callback) {
  callback();
};
