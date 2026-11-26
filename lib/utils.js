'use strict';

// Emitter throws on error event without listeners
const emitError = (emitter, error) => {
  if (emitter.listenerCount('error') > 0) emitter.emit('error', error);
};

const follow = async (pending, task) => {
  try {
    await pending;
  } catch {
    // a failed step does not block the next one
  }
  return task();
};

const settle = async (promise) => {
  try {
    await promise;
  } catch {
    // keep the queue moving
  }
};

const report = async (promise, emitter) => {
  try {
    await promise;
  } catch (error) {
    emitError(emitter, error);
  }
};

module.exports = { emitError, follow, settle, report };
