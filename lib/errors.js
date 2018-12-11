'use strict';

const codes = {
  NOT_IMPLEMENTED: 1000,
  NOT_FOUND: 1001,
  INVALID_SCHEMA: 1002,
  INVALID_CATEGORY_TYPE: 1003,
  INVALID_DELETION_OPERATION: 1004,
};

const defaultMessages = {
  [codes.NOT_IMPLEMENTED]: 'Not implemented',
};

class GSError extends Error {
  constructor(code, message) {
    super(message || defaultMessages[code]);

    this.name = 'GSError';
    this.code = code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GSError);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

module.exports = {
  codes,
  GSError,
};
