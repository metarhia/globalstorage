'use strict';

const { Cursor } = require('./cursor');

class RemoteCursor extends Cursor {
  constructor(connection, options) {
    super(options);
    this.connection = connection;
  }

  // Fetch the data from the server
  // Returns: <Promise>
  async fetch() {
    return new Promise((resolve, reject) => {
      this.connection.callMethod(
        'provider',
        'select',
        [this.category, this.jsql],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }
}

module.exports = { RemoteCursor };
