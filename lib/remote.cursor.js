'use strict';

const { Cursor } = require('./cursor');

class RemoteCursor extends Cursor {
  constructor(connection, options) {
    super(options);
    this.connection = connection;
  }

  // Fetch the data from the server
  //   callback <Function>
  //     error <Error> | <null>
  //     data <Object[]>
  fetch(callback) {
    this.connection.callMethod(
      'provider',
      'select',
      [this.category, this.jsql],
      callback
    );
  }
}

module.exports = { RemoteCursor };
