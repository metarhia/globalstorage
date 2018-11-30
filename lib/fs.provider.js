'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const common = require('@metarhia/common');
const metasync = require('metasync');
const mdsf = require('mdsf');

const { StorageProvider } = require('./provider');
const { FsCursor } = require('./fs.cursor');

const THROTTLE_TIMEOUT = 5000;

class FsProvider extends StorageProvider {
  constructor(
    options // { path } where path is database location
  ) {
    super(options);
    this.stat = null;
  }

  readStat(callback) {
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
  }

  open(options, callback) {
    callback = common.once(callback);
    this.path = options.path;
    super.open(options, () => {
      this.readStat((err, stat) => {
        if (err) {
          callback(new Error('Can not open database: ' + this.path));
        } else {
          this.stat = stat;
          this.active = true;
          callback();
        }
      });
    });
  }

  writeStat(callback) {
    callback = common.once(callback);
    const save = () => {
      const data = mdsf.stringify(this.stat);
      fs.writeFile(this.path + '/.gs', data, callback);
    };
    this.save = this.save || metasync.throttle(THROTTLE_TIMEOUT, save);
    this.save();
  }

  close(callback) {
    callback = common.once(callback);
    this.writeStat();
    this.active = false;
    callback();
  }

  takeId(callback) {
    callback = common.once(callback);
    callback(null, this.stat.next++);
    this.stat.count++;
    this.writeStat();
  }

  get(id, callback) {
    callback = common.once(callback);
    const path = common.idToPath(id);
    fs.readFile(path, (err, data) => {
      if (err) callback(err);
      else callback(null, mdsf.parse(data.toString()));
    });
  }

  create(obj, callback) {
    callback = common.once(callback);
    this.takeId((err, id) => {
      if (err) {
        callback(err);
        return;
      }
      obj.Id = id;
      const data = mdsf.stringify(obj);
      this.stat.size += data.length;
      this.writeStat();
      const place = common.idToChunks(obj.Id);
      place.path = this.path + place.path;
      mkdirp(place.path, err => {
        if (err) {
          callback(err);
          return;
        }
        const pp = place.path + '/' + place.name;
        fs.writeFile(pp, data, err => {
          if (err) callback(err);
          else callback(null, id);
        });
      });
    });
  }

  update(obj, callback) {
    callback = common.once(callback);
    const path = common.idToPath(obj.Id);
    fs.stat(path, (err, stat) => {
      if (err) {
        callback(err);
        return;
      }
      const data = mdsf.stringify(obj);
      this.stat.size += data.length - stat.size;
      this.writeStat();
      fs.writeFile(path, data, err => {
        if (err) callback(err);
        else callback();
      });
    });
  }

  delete(id, callback) {
    callback = common.once(callback);
    const path = common.idToPath(id);
    fs.stat(path, (err, stat) => {
      if (err) {
        callback(err);
        return;
      }
      fs.unlink(path, err => {
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
  }

  select(query, options, callback) {
    if (callback) callback();
    return new FsCursor({
      provider: this,
      jsql: [{ op: 'select', query, options }],
    });
  }
}

module.exports = { FsProvider };
