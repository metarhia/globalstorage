'use strict';

const codes = {
  INTERNAL_PROVIDER_ERROR: 999,
  NOT_IMPLEMENTED: 1000,
  NOT_FOUND: 1001,
  INVALID_SCHEMA: 1002,
  INVALID_CATEGORY_TYPE: 1003,
  INVALID_DELETION_OPERATION: 1004,
  INVALID_CREATION_OPERATION: 1005,
  INSUFFICIENT_PERMISSIONS: 1006,
  ACTION_EXECUTION_ERROR: 1007,
};

const defaultMessages = {
  [codes.NOT_IMPLEMENTED]: 'Not implemented',
};

class ActionError extends Error {
  constructor(name, ctx) {
    super(name);

    this.name = 'ActionError';
    this.ctx = ctx;
  }

  toJSON() {
    return { actionError: { name: this.message, ctx: this.ctx } };
  }

  toJSTP() {
    return [codes.ACTION_EXECUTION_ERROR, this.message, ...this.ctx];
  }
}

class GSError extends Error {
  // Create a GSError that can be based on another error
  // (`error.toString()` then becomes the message) or a regular message
  // Signature: code[, base]
  //   code <number>
  //   base <string> | <Error>
  constructor(code, base) {
    const message =
      typeof base === 'string'
        ? base
        : (base && base.toString()) || defaultMessages[code];
    super(message);

    this.name = 'GSError';
    this.code = code;
    if (base && typeof base !== 'string') {
      this.base = base;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GSError);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  toJSON() {
    return {
      error: { message: this.message, code: this.code, base: this.base },
    };
  }

  toJSTP() {
    if (this.base instanceof ActionError) {
      return this.base;
    }
    if (this.code === codes.INTERNAL_PROVIDER_ERROR) {
      return this.code;
    }
    return [this.code, this.message];
  }

  static wrap(err) {
    if (err instanceof GSError) {
      return err;
    }
    const code =
      err instanceof ActionError
        ? codes.ACTION_EXECUTION_ERROR
        : codes.INTERNAL_PROVIDER_ERROR;
    return new GSError(code, err);
  }
}

module.exports = {
  codes,
  GSError,
  ActionError,
};
