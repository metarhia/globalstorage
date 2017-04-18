'use strict';

module.exports = (api) => {

  api.gs.FsCursor = FsCursor;
  api.util.inherits(FsCursor, api.gs.Cursor);

  // Filesystem Cursor
  //
  function FsCursor(provider) {
    this.provider = provider;
    this.jsql = [];
  }

  FsCursor.prototype.copy = function() {
    return this;
  };

  FsCursor.prototype.clone = function() {
    return this;
  };

  FsCursor.prototype.enroll = function(jsql) {
    console.log(
      'STUB: FsCursor.prototype.enroll(jsql)' +
      JSON.stringify(jsql)
    );
    return this;
  };

  FsCursor.prototype.empty = function() {
    return this;
  };

  FsCursor.prototype.from = function(arr) {
    console.log(
      'STUB: FsCursor.prototype.from(arr)' +
      JSON.stringify(arr)
    );
    return this;
  };

  FsCursor.prototype.map = function(fn) {
    console.log('STUB: FsCursor.prototype.map(fn) ' + fn.name);
    return this;
  };

  FsCursor.prototype.projection = function(mapping) {
    console.log(
      'STUB: FsCursor.prototype.projection(mapping)' +
      JSON.stringify(mapping)
    );
    return this;
  };

  FsCursor.prototype.filter = function(fn) {
    console.log('STUB: FsCursor.prototype.filter(fn) ' + fn.name);
    return this;
  };

  FsCursor.prototype.select = function(query) {
    console.log(
      'STUB: FsCursor.prototype.projection(query)' +
      JSON.stringify(query)
    );
    return this;
  };

  FsCursor.prototype.distinct = function() {
    console.log('STUB: FsCursor.prototype.distinct()');
    return this;
  };

  FsCursor.prototype.find = function(fn) {
    console.log('STUB: FsCursor.prototype.find(fn) ' + fn.name);
    return this;
  };

  FsCursor.prototype.sort = function(fn) {
    console.log('STUB: FsCursor.prototype.sort(fn) ' + fn.name);
    return this;
  };

  FsCursor.prototype.order = function(fields) {
    console.log(
      'STUB: FsCursor.prototype.order(fields) ' +
      JSON.stringify(fields)
    );
    return this;
  };

  FsCursor.prototype.desc = function(fields) {
    console.log(
      'STUB: FsCursor.prototype.desc(fields) ' +
      JSON.stringify(fields)
    );
    return this;
  };

  FsCursor.prototype.fetch = function(done) {
    done();
    return this;
  };

  FsCursor.prototype.next = function(done) {
    done();
    return this;
  };

};
