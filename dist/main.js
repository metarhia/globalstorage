/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const metasync = __webpack_require__(1);

const subtests = [
  __webpack_require__(28),
];

metasync(subtests)(() => {
  console.log('Tests have been executed');
});


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const submodules = [
  'composition', // Unified abstraction
  'control', // Control flow utilities
  'fp', // Async utils for functional programming
  'adapters', // Adapters to convert different async contracts
  'throttle', // Throttling utilities
  'array', // Array utilities
  'chain', // Process arrays sync and async array in chain
  'collector', // DataCollector and KeyCollector
  'queue', // Concurrent queue
  'memoize', // Async memoization
  'do', // Simple chain/do
  'poolify', // Create pool from factory
].map(path => __webpack_require__(2)("./" + path));

const { compose } = submodules[0];
module.exports = Object.assign(compose, ...submodules);


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./adapters": 3,
	"./adapters.js": 3,
	"./array": 6,
	"./array.js": 6,
	"./chain": 11,
	"./chain.js": 11,
	"./collector": 12,
	"./collector.functor": 13,
	"./collector.functor.js": 13,
	"./collector.js": 12,
	"./collector.prototype": 14,
	"./collector.prototype.js": 14,
	"./composition": 18,
	"./composition.js": 18,
	"./control": 19,
	"./control.js": 19,
	"./do": 20,
	"./do.js": 20,
	"./fp": 21,
	"./fp.js": 21,
	"./memoize": 22,
	"./memoize.js": 22,
	"./poolify": 23,
	"./poolify.js": 23,
	"./poolify.opt": 24,
	"./poolify.opt.js": 24,
	"./poolify.symbol": 25,
	"./poolify.symbol.js": 25,
	"./queue": 26,
	"./queue.js": 26,
	"./throttle": 27,
	"./throttle.js": 27
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) { // check for number or string
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return id;
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 2;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const callbackify = (
  // Convert source to callback-last contract
  source // promise or regular synchronous function
  // Returns: callback, function
) => {
  if (typeof(source) === 'function') {
    return (...args) => {
      const callback = common.unsafeCallback(args);
      if (callback) callback(null, source(...args));
    };
  } else {
    let callback = null;
    const fulfilled = value => {
      if (callback) callback(null, value);
    };
    const rejected = reason => {
      if (callback) callback(reason);
    };
    source.then(fulfilled).catch(rejected);
    return (...args) => {
      callback = common.unsafeCallback(args);
    };
  }
};

const promisify = (
  // Convert async function to Promise object
  func // function, callback-last function
  // Returns: object, Promise instance
) => {
  const promisified = (...args) => {
    const promise = new Promise((resolve, reject) => {
      func(...args, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    return promise;
  };
  return promisified;
};

const promisifySync = (
  // Convert sync function to Promise object
  func // function, regular synchronous function
  // Returns: object, Promise instance
) => (...args) => new Promise((resolve, reject) => {
  const result = func(...args);
  if (result instanceof Error) reject(result);
  else resolve(result);
});

module.exports = {
  callbackify,
  promisify,
  promisifySync,
};


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const submodules = [
  'utilities', // Common utilities
  'math', // Math common function
  'array', // Arrays manipulations
  'data', // Data structures manipulations
  'strings', // Strings utilities
  'time', // Data and Time functions
  'fp', // Functional programming
  'oop', // Object-oriented programming
  'callbacks', // Callback utilities
  'events', // Events and emitter
  'units', // Units conversion
  'network', // Network utilities
  'id', // Kyes and identifiers
  'sort', // Sort compare functions
  'cache', // Cache (enhanced Map)
  'mp', // Metaprogramming
].map(path => './lib/' + path).map(__webpack_require__(5));

module.exports = Object.assign({}, ...submodules);


/***/ }),
/* 5 */
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = 5;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(setImmediate) {

const common = __webpack_require__(4);

const map = (
  // Asynchronous map (iterate parallel)
  items, // array, incoming
  fn, // function, (current, callback) => callback(err, value)
  //   to be executed for each value in the array
  //   current - current element being processed in the array
  //   callback - function(err, value)
  done // function (optional), on done callback function(err, result)
) => {
  done = done || common.emptyness;
  const len = items.length;
  if (!len) {
    done(null, []);
    return;
  }
  let errored = false;
  let count = 0;
  const result = new Array(len);

  const next = (index, err, value) => {
    if (errored) return;
    if (err) {
      errored = true;
      done(err);
      return;
    }
    result[index] = value;
    count++;
    if (count === len) done(null, result);
  };

  let i;
  for (i = 0; i < len; i++) {
    fn(items[i], next.bind(null, i));
  }
};

const filter = (
  // Asynchrous filter (iterate parallel)
  items, // array, incoming
  fn, // function, (value, callback) => (err, accepted)
  //    to be executed for each value in the array
  //    value - item from items array
  //    callback - function(err, accepted)
  done // optional on done callback function(err, result)
) => {
  done = done || common.emptyness;
  const len = items.length;

  if (!len) {
    done(null, []);
    return;
  }

  let count = 0;
  let suitable = 0;
  const data = new Array(len);
  const rejected = Symbol('rejected');

  const next = (index, err, accepted) => {
    if (!accepted || err) {
      data[index] = rejected;
    } else {
      data[index] = items[index];
      suitable++;
    }
    count++;
    if (count === len) {
      const result = new Array(suitable);
      let pos = 0;
      let i, val;
      for (i = 0; i < len; i++) {
        val = data[i];
        if (val !== rejected) result[pos++] = val;
      }
      done(null, result);
    }
  };

  let i;
  for (i = 0; i < len; i++) {
    fn(items[i], next.bind(null, i));
  }
};

const reduce = (
  // Asynchronous reduce
  items, // array, incoming
  fn, // function, to be executed for each value in array
  //   previous - value previously returned in the last iteration
  //   current - current element being processed in the array
  //   callback - callback for returning value back to function reduce
  //   counter - index of the current element being processed in array
  //   items - the array reduce was called upon
  done, // function (optional), on done callback function(err, result)
  initial // optional value to be used as first arpument in first iteration
) => {
  done = done || common.emptyness;
  const len = items.length;
  let count = typeof(initial) === 'undefined' ? 1 : 0;

  if (!len) {
    const err = count ? new TypeError(
      'Metasync: reduce of empty array with no initial value'
    ) : null;
    done(err, initial);
    return;
  }

  let previous = count === 1 ? items[0] : initial;
  let current = items[count];
  const last = len - 1;

  const next = (err, data) => {
    if (err) {
      done(err);
      return;
    }
    if (count === last) {
      done(null, data);
      return;
    }
    count++;
    previous = data;
    current = items[count];
    fn(previous, current, next, count, items);
  };

  fn(previous, current, next, count, items);
};

const each = (
  // Asynchronous each (iterate in parallel)
  items, // array, incoming
  fn, // function, (value, callback) => callback(err)
  //   value - item from items array
  //   callback - callback function(err)
  done // function (optional), on done callback function(err, items)
) => {
  done = done || common.emptyness;
  const len = items.length;
  if (len === 0) {
    done(null, items);
    return;
  }
  let count = 0;
  let errored = false;

  const next = (err) => {
    if (errored) return;
    if (err) {
      errored = true;
      done(err);
      return;
    }
    count++;
    if (count === len) done(null);
  };

  let i;
  for (i = 0; i < len; i++) {
    fn(items[i], next);
  }
};

const series = (
  // Asynchronous series
  items, // array, incoming
  fn, // function, (value, callback) => callback(err)
  //   value - item from items array
  //   callback - callback (err)
  done // function (optional), on done callback (err, items)
) => {
  done = done || common.emptyness;
  const len = items.length;
  let i = -1;

  const next = () => {
    i++;
    if (i === len) {
      done(null, items);
      return;
    }
    fn(items[i], (err) => {
      if (err) {
        done(err);
        return;
      }
      setImmediate(next);
    });
  };
  next();
};

const find = (
  // Asynchronous find (iterate in series)
  items, // array, incoming
  fn, // (value, callback) => callback(err, accepted)
  //   value - item from items array
  //   callback - callback function(err, accepted)
  done // function (optional), on done callback function(err, result)
) => {
  done = done || common.emptyness;
  const len = items.length;
  if (len === 0) {
    done();
    return;
  }
  let finished = false;
  const last = len - 1;

  const next = (index, err, accepted) => {
    if (finished) return;
    if (err) {
      finished = true;
      done(err);
      return;
    }
    if (accepted) {
      finished = true;
      done(null, items[index]);
      return;
    }
    if (index === last) done(null);
  };

  let i;
  for (i = 0; i < len; i++) {
    fn(items[i], next.bind(null, i));
  }
};

const every = (
  // Asynchronous every
  items, // array, incoming
  fn, // function, (value, callback) => callback(err, fits)
  //   value - item from items array
  //   callback - callback function(err, fits)
  done // function, optional on done callback function(err, result)
) => {
  done = done || common.emptyness;
  if (items.length === 0) {
    done(null, true);
    return;
  }
  let proceedItemsCount = 0;
  const len = items.length;

  const finish = (err, accepted) => {
    if (!done) return;
    if (err || !accepted) {
      done(err, false);
      done = null;
      return;
    }
    proceedItemsCount++;
    if (proceedItemsCount === len) done(null, true);
  };

  let item;
  for (item of items) fn(item, finish);
};

const some = (
  // Asynchronous some (iterate in series)
  items, // array, incoming
  fn, // function, (value, callback) => (err, accepted)
  //   value - item from items array
  //   callback - callback function(err, accepted)
  done // function, on done callback function(err, result)
) => {
  done = done || common.emptyness;
  const len = items.length;
  let i = 0;

  const next = () => {
    if (i === len) {
      done(null, false);
      return;
    }
    fn(items[i], (err, accepted) => {
      if (err) {
        done(err);
        return;
      }
      if (accepted) {
        done(null, true);
        return;
      }
      i++;
      next();
    });
  };

  if (len > 0) next();
  else done(null, false);
};

module.exports = {
  map,
  filter,
  reduce,
  each,
  series,
  find,
  every,
  some,
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7).setImmediate))

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var scope = (typeof global !== "undefined" && global) ||
            (typeof self !== "undefined" && self) ||
            window;
var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, scope, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, scope, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(scope, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(9);
// On some exotic environments, it's not clear which object `setimmediate` was
// able to install onto.  Search each possibility in the same order as the
// `setimmediate` library.
exports.setImmediate = (typeof self !== "undefined" && self.setImmediate) ||
                       (typeof global !== "undefined" && global.setImmediate) ||
                       (this && this.setImmediate);
exports.clearImmediate = (typeof self !== "undefined" && self.clearImmediate) ||
                         (typeof global !== "undefined" && global.clearImmediate) ||
                         (this && this.clearImmediate);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(8)))

/***/ }),
/* 8 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(8), __webpack_require__(10)))

/***/ }),
/* 10 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const { map, filter, reduce, each, series, find } = __webpack_require__(6);

const async = op => {
  switch (op) {
    case 'map': return map;
    case 'filter': return filter;
    case 'reduce': return reduce;
    case 'each': return each;
    case 'series': return series;
    case 'find': return find;
  }
};

function ArrayChain(array) {
  this.array = array;
  this.chain = [];
}

ArrayChain.prototype.execute = function(err) {
  const item = this.chain.shift() || {};

  if (!item.op) {
    if (err) throw err;
    else return;
  }

  const next = (err, data) => {
    this.array = data;
    this.execute(err);
  };

  if (item.op === 'fetch') {
    return item.fn(err, this.array, next);
  }

  if (err) {
    this.execute(err);
    return;
  }

  if (item.isSync) {
    this.array = item.fn();
    this.execute(null);
  } else {
    const op = async(item.op);
    op(this.array, item.fn, next);
  }
};

ArrayChain.prototype.fetch = function(fn) {
  this.chain.push({ op: 'fetch', fn });
  this.execute();
  return this;
};

ArrayChain.prototype.map = function(fn) {
  this.chain.push({ op: 'map', fn });
  return this;
};

ArrayChain.prototype.filter = function(fn) {
  this.chain.push({ op: 'filter', fn });
  return this;
};

ArrayChain.prototype.reduce = function(fn) {
  this.chain.push({ op: 'reduce', fn });
  return this;
};

ArrayChain.prototype.each = function(fn) {
  this.chain.push({ op: 'each', fn });
  return this;
};

ArrayChain.prototype.series = function(fn) {
  this.chain.push({ op: 'series', fn });
  return this;
};

ArrayChain.prototype.find = function(fn) {
  this.chain.push({ op: 'find', fn });
  return this;
};

const syncDelegates = {
  returns: {
    opNames: ['concat', 'slice', 'includes'],
    handler(op, ...args) {
      return this.array[op](...args);
    }
  },
  modify: {
    opNames: ['reverse', 'sort', 'shift', 'unshift', 'push', 'pop'],
    handler(op, ...args) {
      this.array[op](...args);
      return this.array;
    }
  }
};

for (const delegateType in syncDelegates) {
  const { opNames, handler } = syncDelegates[delegateType];
  for (const op of opNames) {
    ArrayChain.prototype[op] = function(...args) {
      const fn = handler.bind(this, op, ...args);
      this.chain.push({ op, fn, isSync: true });
      return this;
    };
  }
}

const forArrayChain = (
  // Create an ArrayChain instance
  array // array, start mutations from this data
  // Returns: ArrayChain instance
) => (
  new ArrayChain(array)
);

module.exports = {
  for: forArrayChain,
};


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

function Collector(
  expected // number or array of string, count or keys
) {
  this.expectKeys = Array.isArray(expected) ? new Set(expected) : null;
  this.expected = this.expectKeys ? expected.length : expected;
  this.keys = new Set();
  this.count = 0;
  this.timer = null;
  this.onDone = common.emptiness;
  this.isDistinct = false;
  this.isDone = false;
  this.data = {};
}

Collector.prototype.collect = function(key, err, value) {
  if (this.isDone) return this;
  if (err) {
    this.finalize(err, this.data);
    return this;
  }
  if (this.expectKeys && !this.expectKeys.has(key)) {
    if (this.isDistinct) {
      const err = new Error('Metasync: unexpected key: ' + key);
      this.finalize(err, this.data);
      return this;
    }
  } else if (!this.keys.has(key)) {
    this.count++;
  }
  this.data[key] = value;
  this.keys.add(key);
  if (this.expected === this.count) {
    this.finalize(null, this.data);
  }
  return this;
};

Collector.prototype.pick = function(key, value) {
  this.collect(key, null, value);
  return this;
};

Collector.prototype.fail = function(key, err) {
  this.collect(key, err);
  return this;
};

Collector.prototype.take = function(key, fn, ...args) {
  fn(...args, (err, data) => {
    this.collect(key, err, data);
  });
  return this;
};

Collector.prototype.timeout = function(msec) {
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }
  if (msec > 0) {
    this.timer = setTimeout(() => {
      const err = new Error('Metasync: Collector timed out');
      this.finalize(err, this.data);
    }, msec);
  }
  return this;
};

Collector.prototype.done = function(callback) {
  this.onDone = callback;
  return this;
};

Collector.prototype.finalize = function(key, err, data) {
  if (this.isDone) return this;
  if (this.onDone) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isDone = true;
    this.onDone(key, err, data);
  }
  return this;
};

Collector.prototype.distinct = function(value = true) {
  this.isDistinct = value;
  return this;
};

Collector.prototype.cancel = function(err) {
  err = err || new Error('Metasync: Collector cancelled');
  this.finalize(err, this.data);
  return this;
};

Collector.prototype.then = function(fulfilled, rejected) {
  const fulfill = common.once(fulfilled);
  const reject = common.once(rejected);
  this.onDone = (err, result) => {
    if (err) reject(err);
    else fulfill(result);
  };
  return this;
};

const collect = (
  // Collector instance constructor
  expected // number or array of string,
  // Returns: Collector, instance
) => (
  new Collector(expected)
);

module.exports = {
  collect,
};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const collect = (
  // Collector instance constructor
  expected // number or array of string, count or keys
  // Returns: functor, collector
) => {
  const isCount = typeof(expected) === 'number';
  const isKeys = Array.isArray(expected);
  if (!(isCount || isKeys)) throw new TypeError('Metasync: unexpected type');
  let keys = null;
  if (isKeys) {
    keys = new Set(expected);
    expected = expected.length;
  }
  let count = 0;
  let timer = null;
  let onDone = null;
  let isDistinct = false;
  let isDone = false;
  const data = {};

  const collector = (key, err, value) => {
    if (isDone) return collector;
    if (!isDistinct || !(key in data)) {
      if (!isCount && !keys.has(key)) return;
      count++;
    }
    if (err) {
      collector.finalize(err, data);
      return;
    }
    data[key] = value;
    if (expected === count) {
      if (timer) clearTimeout(timer);
      collector.finalize(null, data);
    }
    return collector;
  };

  const methods = {
    pick: (key, value) => collector(key, null, value),
    fail: (key, err) => collector(key, err),

    take: (key, fn, ...args) => {
      fn(...args, (err, data) => collector(key, err, data));
      return collector;
    },

    timeout: (msec) => {
      if (msec) {
        timer = setTimeout(() => {
          const err = new Error('Metasync: Collector timed out');
          collector.finalize(err, data);
        }, msec);
        timer.unref();
      }
      return collector;
    },

    done: (
      callback // function, (error, data)
    ) => {
      onDone = callback;
      return collector;
    },

    finalize: (err, data) => {
      if (isDone) return collector;
      isDone = true;
      if (onDone) onDone(err, data);
      return collector;
    },

    distinct: (value = true) => {
      isDistinct = value;
      return collector;
    }
  };

  return Object.assign(collector, methods);
};

module.exports = {
  collect,
};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const util = __webpack_require__(15);

function Collector() {}

Collector.prototype.on = function(
  // Collector events
  eventName, // string
  listener // function, handler
  // on('error', function(err, key))
  // on('timeout', function(err, data))
  // on('done', function(errs, data))
) {
  if (eventName in this.events) {
    this.events[eventName] = listener;
  }
};

Collector.prototype.emit = function(
  // Emit Collector events
  eventName, // string
  err, // Error, instance
  data
) {
  const event = this.events[eventName];
  if (event) event(err, data);
};

const DataCollector = function(
  expected, // number, count of `collect()` calls expected
  timeout // number (optional), collect timeout
  // Returns: DataCollector, instance
) {
  this.expected = expected;
  this.timeout = timeout;
  this.count = 0;
  this.data = {};
  this.errs = [];
  this.events = {
    error: null,
    timeout: null,
    done: null
  };
  if (this.timeout) {
    this.timer = setTimeout(() => {
      const err = new Error('Metasync: DataCollector timed out');
      this.emit('timeout', err, this.data);
    }, timeout);
  }
};

util.inherits(DataCollector, Collector);

DataCollector.prototype.collect = function(
  // Push data to collector
  key, // string, key in result data
  data // value or Error instance
) {
  this.count++;
  if (data instanceof Error) {
    this.errs[key] = data;
    this.emit('error', data, key);
  } else {
    this.data[key] = data;
  }
  if (this.expected === this.count) {
    if (this.timer) clearTimeout(this.timer);
    const errs = this.errs.length ? this.errs : null;
    this.emit('done', errs, this.data);
  }
};

const KeyCollector = function(
  // Key Collector
  keys, // array of strings, example: ['config', 'users', 'cities']
  timeout // number (optional), collect timeout
  // Returns: DataCollector, instance
) {
  this.isDone = false;
  this.keys = keys;
  this.expected = keys.length;
  this.count = 0;
  this.timeout = timeout;
  this.data = {};
  this.errs = [];
  this.events = {
    error: null,
    timeout: null,
    done: null
  };
  const collector = this;
  if (this.timeout) {
    this.timer = setTimeout(() => {
      const err = new Error('Metasync: KeyCollector timed out');
      collector.emit('timeout', err, collector.data);
    }, timeout);
  }
};

util.inherits(KeyCollector, Collector);

KeyCollector.prototype.collect = function(
  key, // string
  data // scalar or object
) {
  if (this.keys.includes(key)) {
    this.count++;
    if (data instanceof Error) {
      this.errs[key] = data;
      this.emit('error', data, key);
    } else {
      this.data[key] = data;
    }
    if (this.expected === this.count) {
      if (this.timer) clearTimeout(this.timer);
      const errs = this.errs.length ? this.errs : null;
      this.emit('done', errs, this.data);
    }
  }
};

KeyCollector.prototype.stop = function() {
};

KeyCollector.prototype.pause = function() {
};

KeyCollector.prototype.resume = function() {
};

module.exports = {
  DataCollector,
  KeyCollector,
};


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(16);

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(17);

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(8), __webpack_require__(10)))

/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),
/* 17 */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function Composition() {}

const compose = (
  // Asynchronous functions composition
  flow // array of functions, callback-last / err-first
  // Returns: function, composed callback-last / err-first
) => {
  const comp = (data, callback) => {
    if (!callback) {
      callback = data;
      data = {};
    }
    comp.done = callback;
    if (comp.canceled) {
      if (callback) {
        callback(new Error('Metasync: asynchronous composition canceled'));
      }
      return;
    }
    if (comp.timeout) {
      comp.timer = setTimeout(() => {
        comp.timer = null;
        if (callback) {
          callback(new Error('Metasync: asynchronous composition timed out'));
          comp.done = null;
        }
      }, comp.timeout);
    }
    comp.context = data;
    comp.arrayed = Array.isArray(comp.context);
    comp.paused = false;
    if (comp.len === 0) {
      comp.finalize();
      return;
    }
    if (comp.parallelize) comp.parallel();
    else comp.sequential();
  };
  const first = flow[0];
  const parallelize = Array.isArray(first);
  const fns = parallelize ? first : flow;
  comp.fns = fns;
  comp.parallelize = parallelize;
  comp.context = null;
  comp.timeout = 0;
  comp.timer = null;
  comp.len = fns.length;
  comp.canceled = false;
  comp.paused = true;
  comp.arrayed = false;
  comp.done = null;
  comp.onResume = null;
  Object.setPrototypeOf(comp, Composition.prototype);
  return comp;
};

Composition.prototype.on = function(name, callback) {
  if (name === 'resume') {
    this.onResume = callback;
  }
};

Composition.prototype.finalize = function(err) {
  if (this.canceled) return;
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }
  const callback = this.done;
  if (callback) {
    if (this.paused) {
      this.on('resume', () => {
        this.done = null;
        callback(err, this.context);
      });
    } else {
      this.done = null;
      callback(err, this.context);
    }
  }
};

Composition.prototype.collect = function(err, result) {
  if (this.canceled) return;
  if (err) {
    const callback = this.done;
    if (callback) {
      this.done = null;
      callback(err);
    }
    return;
  }
  if (result !== this.context && result !== undefined) {
    if (this.arrayed) {
      this.context.push(result);
    } else if (typeof(result) === 'object') {
      Object.assign(this.context, result);
    }
  }
};

Composition.prototype.parallel = function() {
  let counter = 0;
  const next = (err, result) => {
    this.collect(err, result);
    if (++counter === this.len) this.finalize();
  };
  const fns = this.fns;
  const len = this.len;
  const context = this.context;
  let i, fn, fc;
  for (i = 0; i < len; i++) {
    fn = fns[i];
    fc = Array.isArray(fn) ? compose(fn) : fn;
    fc(context, next);
  }
};

Composition.prototype.sequential = function() {
  let counter = -1;
  const fns = this.fns;
  const len = this.len;
  const context = this.context;
  const next = (err, result) => {
    if (err || result) this.collect(err, result);
    if (++counter === len) {
      this.finalize();
      return;
    }
    const fn = fns[counter];
    const fc = Array.isArray(fn) ? compose(fn) : fn;
    if (this.paused) {
      this.on('resume', () => fc(context, next));
    } else {
      fc(context, next);
    }
  };
  next();
};

Composition.prototype.then = function(fulfill, reject) {
  if (this.canceled) {
    reject(new Error('Metasync: asynchronous composition canceled'));
    return;
  }
  this((err, result) => {
    if (err) reject(err);
    else fulfill(result);
  });
  return this;
};

Composition.prototype.clone = function() {
  const fns = this.fns.slice();
  const flow = this.parallelize ? [fns] : fns;
  return compose(flow);
};

Composition.prototype.pause = function() {
  if (this.canceled) return this;
  this.paused = true;
  return this;
};

Composition.prototype.resume = function() {
  if (this.canceled) return this;
  this.paused = false;
  if (this.onResume) {
    const callback = this.onResume;
    this.onResume = null;
    callback();
  }
  return this;
};

Composition.prototype.timeout = function(msec) {
  this.timeout = msec;
  return this;
};

Composition.prototype.cancel = function() {
  if (this.canceled) return this;
  this.canceled = true;
  const callback = this.done;
  if (callback) {
    this.done = null;
    callback(new Error('Metasync: asynchronous composition canceled'));
  }
  return this;
};

module.exports = { compose };


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const { each } = __webpack_require__(6);

const firstOf = (
  // Executes all asynchronous functions and pass first result to callback
  fns, // array of function, callback-last / err-first
  callback // function, err-first on done
) => {
  const done = common.once(callback);
  each(fns, (f, iterCb) => f((...args) => {
    done(...args);
    iterCb(...args);
  }));
};

const parallel = (
  // Parallel execution
  fns, // array of function, callback-last / err-first
  context, // incoming data (optional)
  callback // function, err-first on done
) => {
  if (!callback) {
    callback = context;
    context = {};
  }
  const done = common.once(callback);
  const isArray = Array.isArray(context);
  const len = fns.length;
  if (len === 0) {
    done(null, context);
    return;
  }
  let counter = 0;

  const finishFn = (fn, err, result) => {
    if (err) {
      done(err);
      return;
    }
    if (result !== context && result !== undefined) {
      if (isArray) context.push(result);
      else if (typeof(result) === 'object') Object.assign(context, result);
    }
    if (++counter === len) done(null, context);
  };

  let fn;
  for (fn of fns) {
    // fn may be array of function
    const finish = finishFn.bind(null, fn);
    if (fn.length === 2) fn(context, finish);
    else fn(finish);
  }
};

const sequential = (
  // Sequential execution
  fns, // array of callback-last functions, callback contranct err-first
  context, // incoming data (optional)
  callback // function, err-first on done
) => {
  if (!callback) {
    callback = context;
    context = {};
  }
  const done = common.once(callback);
  const isArray = Array.isArray(context);
  const len = fns.length;
  if (len === 0) {
    done(null, context);
    return;
  }
  let i = -1;

  function next() {
    let fn = null;
    const finish = (err, result) => {
      if (result !== context && result !== undefined) {
        if (isArray) context.push(result);
        else if (typeof(result) === 'object') Object.assign(context, result);
      }
      if (err) {
        done(err);
        return;
      }
      next();
    };
    if (++i === len) {
      done(null, context);
      return;
    }
    fn = fns[i];
    if (fn.length === 2) fn(context, finish);
    else fn(finish);
  }

  next();
};

module.exports = {
  firstOf,
  parallel,
  sequential,
};


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function Do() {}

const chain = function(fn, ...args) {
  const current = (done) => {
    if (done) current.done = done;
    if (current.prev) {
      current.prev.next = current;
      current.prev();
    } else {
      current.forward();
    }
    return current;
  };

  const prev = this instanceof Do ? this : null;
  const fields = { prev, fn, args, done: null };

  Object.setPrototypeOf(current, Do.prototype);
  return Object.assign(current, fields);
};

Do.prototype.do = function(fn, ...args) {
  return chain.call(this, fn, ...args);
};

Do.prototype.forward = function() {
  if (this.fn) this.fn(...this.args, (err, data) => {
    const next = this.next;
    if (next) {
      if (next.fn) next.forward();
    } else if (this.done) {
      this.done(err, data);
    }
  });
};

module.exports = {
  do: chain,
};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let asyncChainMethods = null;

const toAsync = (
  // Transforms function with args arguments and callback
  // to function with args as separate values and callback
  fn // function, callback-last / err-first
  // Returns: function
) => (...argsCb) => {
  const len = argsCb.length - 1;
  const callback = argsCb[len];
  const args = argsCb.slice(0, len);
  return fn(args, callback);
};

const asAsync = (
  fn, // function, asynchronous
  ...args // array, its argumants
) => {
  const wrapped = fn.bind(null, ...args);
  for (const name in asyncChainMethods) {
    const method = asyncChainMethods[name];
    wrapped[name] = (...args) => asAsync(method(wrapped, ...args));
  }
  return wrapped;
};

const of = (
  // Hint: pure :: Applicative f => a -> f a
  ...args // array
) => (
  asAsync(callback => callback(null, ...args))
);

const concat = (
  // Hint: concat :: Monoid m => a -> a -> a
  fn1, // function
  fn2 // function
) => toAsync(
  (args1, callback) => fn1(...args1, (err, ...args2) => {
    if (err !== null) callback(err);
    else fn2(...args2, callback);
  })
);

const fmap = (
  // Hint: fmap :: Functor f => (a -> b) -> f a -> f b
  fn1, // function
  f // function
) => {
  const fn2 = toAsync((args, callback) => of(f(...args))(callback));
  return concat(fn1, fn2);
};

const ap = (
  // Apply
  // Hint: <*> :: Applicative f => f (a -> b) -> f a -> f b
  fn, // function
  funcA // function
) => (
  concat(funcA, (f, callback) => fmap(fn, f)(callback))
);

asyncChainMethods = { fmap, ap, concat };

module.exports = {
  toAsync,
  asAsync,
  of,
  concat,
  fmap,
  ap,
};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function Memoized() {}

const memoize = (
  // Create memoized function
  fn // function, sync or async
  // Returns: function, memoized
) => {
  const cache = new Map();

  const memoized = function(...args) {
    const callback = args.pop();
    const key = args[0];
    const record = cache.get(key);
    if (record) {
      callback(record.err, record.data);
      return;
    }
    fn(...args, (err, data) => {
      memoized.add(key, err, data);
      memoized.emit('memoize', key, err, data);
      callback(err, data);
    });
  };

  const fields = {
    cache,
    timeout: 0,
    limit: 0,
    size: 0,
    maxSize: 0,
    maxCount: 0,
    events: {
      timeout: null,
      memoize: null,
      overflow: null,
      add: null,
      del: null,
      clear: null
    }
  };

  Object.setPrototypeOf(memoized, Memoized.prototype);
  return Object.assign(memoized, fields);
};

Memoized.prototype.clear = function() {
  this.emit('clear');
  this.cache.clear();
};

Memoized.prototype.add = function(key, err, data) {
  this.emit('add', err, data);
  this.cache.set(key, { err, data });
  return this;
};

Memoized.prototype.del = function(key) {
  this.emit('del', key);
  this.cache.delete(key);
  return this;
};

Memoized.prototype.get = function(key, callback) {
  const record = this.cache.get(key);
  callback(record.err, record.data);
  return this;
};

Memoized.prototype.on = function(
  eventName, // string
  listener // function, handler
  // on('memoize', function(err, data))
  // on('add', function(key, err, data))
  // on('del', function(key))
  // on('clear', function())
) {
  if (eventName in this.events) {
    this.events[eventName] = listener;
  }
};

Memoized.prototype.emit = function(
  // Emit Collector events
  eventName, // string
  ...args // rest arguments
) {
  const event = this.events[eventName];
  if (event) event(...args);
};

module.exports = {
  memoize,
};


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(setImmediate) {

const duplicate = (factory, n) => Array.from({ length: n }, factory);

const provide = callback => item => {
  setImmediate(() => {
    callback(item);
  });
};

const poolify = (factory, min, norm, max) => {
  let allocated = norm;
  const pool = (par) => {
    if (Array.isArray(par)) {
      while (par.length) {
        const item = par.shift();
        const delayed = pool.delayed.shift();
        if (delayed) delayed(item);
        else pool.items.push(item);
      }
      return;
    }
    if (pool.items.length < min && allocated < max) {
      const grow = Math.min(max - allocated, norm - pool.items.length);
      allocated += grow;
      const items = duplicate(factory, grow);
      pool.items.push(...items);
    }
    const res = pool.items.pop();
    if (!par) return res;
    const callback = provide(par);
    if (res) callback(res);
    else pool.delayed.push(callback);
  };
  return Object.assign(pool, {
    items: duplicate(factory, norm),
    delayed: []
  });
};

module.exports = {
  poolify,
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7).setImmediate))

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(setImmediate) {

const duplicate = (factory, n) => Array.from({ length: n }, factory);

const provide = callback => item => {
  setImmediate(() => {
    callback(item);
  });
};

const poolify = (factory, min, norm, max) => {
  let allocated = norm;
  const items = duplicate(factory, norm);
  const delayed = [];
  return (par) => {
    if (Array.isArray(par)) {
      while (par.length) {
        const item = par.shift();
        const request = delayed.shift();
        if (request) request(item);
        else items.push(item);
      }
      return;
    }
    if (items.length < min && allocated < max) {
      const grow = Math.min(max - allocated, norm - items.length);
      allocated += grow;
      const instances = duplicate(factory, grow);
      items.push(...instances);
    }
    const res = items.pop();
    if (!par) return res;
    const callback = provide(par);
    if (res) callback(res);
    else delayed.push(callback);
  };
};

module.exports = {
  poolify,
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7).setImmediate))

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(setImmediate) {

const poolified = Symbol('poolified');

const mixFlag = { [poolified]: true };

const duplicate = (factory, n) => Array
  .from({ length: n }, factory)
  .map(instance => Object.assign(instance, mixFlag));

const provide = callback => item => {
  setImmediate(() => {
    callback(item);
  });
};

const poolify = (factory, min, norm, max) => {
  let allocated = norm;
  const pool = (par) => {
    if (par && par[poolified]) {
      const delayed = pool.delayed.shift();
      if (delayed) delayed(par);
      else pool.items.push(par);
      return;
    }
    if (pool.items.length < min && allocated < max) {
      const grow = Math.min(max - allocated, norm - pool.items.length);
      allocated += grow;
      const items = duplicate(factory, grow);
      pool.items.push(...items);
    }
    const res = pool.items.pop();
    if (!par) return res;
    const callback = provide(par);
    if (res) callback(res);
    else pool.delayed.push(callback);
  };
  return Object.assign(pool, {
    items: duplicate(factory, norm),
    delayed: []
  });
};

module.exports = {
  poolify,
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(7).setImmediate))

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function Queue(
  concurrency // number, asynchronous concurrency
) {
  this.paused = false;
  this.concurrency = concurrency;
  this.waitTimeout = 0;
  this.processTimeout = 0;
  this.throttleCount = 0;
  this.throttleInterval = 1000;
  this.count = 0;
  this.tasks = [];
  this.waiting = [];
  this.factors = {};
  this.fifoMode = true;
  this.roundRobinMode = false;
  this.priorityMode = false;
  this.onProcess = null;
  this.onDone = null;
  this.onSuccess = null;
  this.onTimeout = null;
  this.onFailure = null;
  this.onDrain = null;
}

Queue.prototype.wait = function(
  // Set wait before processing timeout
  msec // number, wait timeout for single item
) {
  this.waitTimeout = msec;
  return this;
};

Queue.prototype.throttle = function(
  // Throttle to limit throughput
  count, // number, item count
  interval = 1000 // number (optional), per interval, default: 1000 msec
) {
  this.throttleCount = count;
  this.throttleInterval = interval;
  return this;
};

Queue.prototype.add = function(
  // Add item to queue
  item, // object, to be added
  factor = 0, // number or string (optional), type, source, destination or path
  priority = 0 // number (optional)
) {
  if (this.priorityMode && !this.roundRobinMode) {
    priority = factor;
    factor = 0;
  }
  const task = [item, factor, priority];
  const slot = this.count < this.concurrency;
  if (!this.paused && slot && this.onProcess) {
    this.next(task);
    return this;
  }
  let tasks;
  if (this.roundRobinMode) {
    tasks = this.factors[factor];
    if (!tasks) {
      tasks = [];
      this.factors[factor] = tasks;
      this.waiting.push(tasks);
    }
  } else {
    tasks = this.tasks;
  }

  if (this.fifoMode) tasks.push(task);
  else tasks.unshift(task);

  if (this.priorityMode) {
    if (this.fifoMode) {
      tasks.sort((a, b) => b[2] - a[2]);
    } else {
      tasks.sort((a, b) => a[2] - b[2]);
    }
  }
  return this;
};

Queue.prototype.next = function(
  // Process next item
  task // array, next task [item, factor, priority]
) {
  const item = task[0];
  let timer;
  this.count++;
  if (this.processTimeout) {
    timer = setTimeout(() => {
      const err = new Error('Metasync: Queue timed out');
      if (this.onTimeout) this.onTimeout(err);
    }, this.processTimeout);
  }
  this.onProcess(item, (err, result) => {
    if (this.onDone) this.onDone(err, result);
    if (err) {
      if (this.onFailure) this.onFailure(err);
    } else if (this.onSuccess) {
      this.onSuccess(result);
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    this.count--;
    if (this.tasks.length > 0 || this.waiting.length > 0) {
      this.takeNext();
    } else if (this.count === 0 && this.onDrain) {
      this.onDrain();
    }
  });
  return this;
};

Queue.prototype.takeNext = function(
  // Prepare next item for processing
) {
  if (this.paused || !this.onProcess) {
    return this;
  }
  let tasks;
  if (this.roundRobinMode) {
    tasks = this.waiting.shift();
    if (tasks.length > 1) {
      this.waiting.push(tasks);
    }
  } else {
    tasks = this.tasks;
  }
  const task = tasks.shift();
  if (task) this.next(task);
};

Queue.prototype.pause = function(
  // Pause queue
) {
  this.paused = true;
  // stub
  return this;
};

Queue.prototype.resume = function(
  // Resume queue
) {
  this.paused = false;
  // stub
  return this;
};

Queue.prototype.clear = function(
  // Clear queue
) {
  this.count = 0;
  this.tasks = [];
  this.waiting = [];
  this.factors = {};
  return this;
};

Queue.prototype.timeout = function(
  // Set timeout interval and listener
  msec, // number, process timeout for single item
  onTimeout = null // function, (item) => {}
) {
  this.processTimeout = msec;
  this.onTimeout = onTimeout;
  return this;
};

Queue.prototype.process = function(
  // Set processing function
  fn // function, processing (item, callback)
) {
  this.onProcess = fn;
  return this;
};

Queue.prototype.done = function(
  // Set listener on processing done
  fn // function, done listener (err, result)
) {
  this.onDone = fn;
  return this;
};

Queue.prototype.success = function(
  // Set listener on processing success
  listener // function, on success (item) => {}
) {
  this.onSuccess = listener;
  return this;
};

Queue.prototype.failure = function(
  // Set listener on processing error
  listener // function, on failure (err, item) => {}
) {
  this.onFailure = listener;
  return this;
};

Queue.prototype.drain = function(
  // Set listener on drain Queue
  listener // function, on drain () => {}
) {
  this.onDrain = listener;
  return this;
};

Queue.prototype.fifo = function(
  // Switch FIFO mode (default for Queue)
) {
  this.fifoMode = true;
  return this;
};

Queue.prototype.lifo = function(
  // Switch LIFO mode
) {
  this.fifoMode = false;
  return this;
};

Queue.prototype.priority = function(
  // Activate or deactivate priority mode
  flag = true // boolean, default: true, use false to disable priority mode
) {
  this.priorityMode = flag;
  return this;
};

Queue.prototype.roundRobin = function(
  // Activate or deactivate round robin mode
  flag = true // boolean, default: true, use false to disable roundRobin mode
) {
  this.roundRobinMode = flag;
  return this;
};

Queue.prototype.pipe = function(
  // Pipe processed items to different queue
  dest // Queue, destination queue
) {
  if (dest instanceof Queue) {
    this.success((item) => {
      dest.add(item);
    });
  }
  return this;
};

const queue = (
  // Queue instantiation
  concurrency // number, of simultaneous and asynchronously executing tasks
  // Returns: Queue, instance
) => (
  new Queue(concurrency)
);

module.exports = {
  queue,
};


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const throttle = (
  // Function throttling, executed once per interval
  timeout, // number, msec interval
  fn, // function, to be throttled
  ...args // array (optional), arguments for fn
  // Returns: function
) => {
  let timer;
  let wait = false;

  const execute = args ?
    (...pars) => (pars ? fn(...args, ...pars) : fn(...args)) :
    (...pars) => (pars ? fn(...pars) : fn());

  const delayed = (...pars) => {
    timer = undefined;
    if (wait) execute(...pars);
  };

  const throttled = (...pars) => {
    if (!timer) {
      timer = setTimeout(delayed, timeout, ...pars);
      wait = false;
      execute(...pars);
    }
    wait = true;
  };

  return throttled;
};

const debounce = (
  // Debounce function, delayed execution
  timeout, // number, msec
  fn, // function, to be debounced
  ...args // array (optional), arguments for fn
) => {
  let timer;

  const debounced = () => (args ? fn(...args) : fn());

  const wrapped = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(debounced, timeout);
  };

  return wrapped;
};

const timeout = (
  // Set timeout for asynchronous function execution
  timeout, // number, time interval
  fn, // function, to be executed
  callback // function, callback on done
) => {
  let finished = false;

  const timer = setTimeout(() => {
    finished = true;
    callback(new Error('Metasync: asynchronous function timed out'));
  }, timeout);

  fn((...args) => {
    if (!finished) {
      clearTimeout(timer);
      finished = true;
      return callback(...args);
    }
  });
};

module.exports = {
  throttle,
  debounce,
  timeout,
};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-env browser */

const metatests = __webpack_require__(29);
const metasync = __webpack_require__(1);
const { IndexedDBProvider } = __webpack_require__(30);

const clear = (provider, callback) => {
  const tx = provider.db.transaction(provider.options.storeName, 'readwrite');
  const store = tx.objectStore(provider.options.storeName);
  const req = store.clear();
  req.onsuccess = () => {
    store.add({ idCounter: 0 }, provider.options.idLabel);
  };
  tx.oncomplete = () => callback(null);
  tx.onerror = () => callback(tx.error);
};

const open = (callback) => {
  const provider = new IndexedDBProvider();
  provider.open({}, (err) => {
    if (err) return callback(err);
    clear(provider, (err) => {
      if (err) return callback(err);
      callback(null, provider);
    });
  });
};

const generateIdTest = (provider, done) => (test) => {
  provider.generateId((err, id) => {
    test.strictSame(err, null);
    test.strictSame(id, 0);
    provider.generateId((err, id) => {
      test.strictSame(err, null);
      test.strictSame(id, 1);
      test.end('indexeddb provider end');
      done();
    });
  });
};

const operationsTest = (provider, done) => (test) => {
  const obj = { name: 'qwerty' };
  provider.create(obj, (err, id) => {
    test.strictSame(err, null);
    const expected = { name: 'qwerty', address: 'ytrewq', id };
    const obj2 = { address: 'ytrewq', id };
    Object.assign(obj2, obj);
    provider.update(obj2, (err) => {
      test.strictSame(err, null);
      provider.get(id, (err, obj3) => {
        test.strictSame(err, null);
        test.strictSame(obj3, expected);
        provider.delete(id, (err) => {
          test.strictSame(err, null);
          provider.get(id, (err, obj4) => {
            test.strictSame(err, null);
            test.strictSame(typeof obj4, 'undefined');
            test.end('localstorage provider end');
            done();
          });
        });
      });
    });
  });
};

const selectTest = (provider, done) => (test) => {
  const persons = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }, {
    category: 'Person',
    name: 'Victor Glushkov',
    city: 'Rostov on Don',
    born: 1923,
  }];
  const expected = [{
    category: 'Person',
    name: 'Marcus Aurelius',
    city: 'Rome',
    born: 121,
  }, {
    category: 'Person',
    name: 'Victor Glushkov',
    city: 'Rostov on Don',
    born: 1923,
  }];

  metasync.map(persons, (person, done) => {
    provider.create(person, (err, id) => {
      if (err) {
        console.log('Error: ', err);
      }
      //test.strictSame(err, null);
      done(null, id);
    });
  }, (err, ids) => {
    for (let i = 0; i < expected.length; i++) {
      expected[i].id = ids[i];
    }

    provider.select({}).fetch((err, ds) => {
      test.strictSame(err, null);
      test.strictSame(ds, expected);
      test.end('localstorage provider end');
      done();
    });
  });
};

module.exports = (data, done) => {
  open((err, provider) => {
    if (err) {
      return done(new Error('error opening indexed db provider: ' + err));
    }
    const tests = [{
      name: 'indexeddb provider: generateId',
      test: generateIdTest,
    }, {
      name: 'indexeddb provider: create, update, get, delete, get',
      test: operationsTest,
    }, {
      name: 'indexeddb provider: select',
      test: selectTest,
    }].map(({ name, test }) => (data, done) =>
      metatests.test(name, test(provider, done))
    );
    metasync(tests)(() => {
      done();
    });
  });
};


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function Test(name) {
  this.name = name;
}

Test.prototype.end = () => {};

const formatErr = (v1, v2) => 'strictSame:\n' +
        'actual: ' + JSON.stringify(v1) + '\n' +
        'expected: ' + JSON.stringify(v2) + '\n';

const equal = (v1, v2) => {
  if (typeof(v1) !== 'object' || !v1 || !v2) return v1 === v2;
  const k1 = new Set(Object.keys(v1));
  const k2 = Object.keys(v2);
  if (k1.size !== k2.length) return false;
  for (const key of k2) {
    if (!k1.has(key) || !equal(v1[key], v2[key])) {
      return false;
    }
  }
  return true;
};

Test.prototype.strictSame = function(v1, v2) {
  if (equal(v1, v2)) return;
  const errStr = formatErr(v1, v2);
  console.dir(new Error(this.name + ': ' + errStr));
};

module.exports = {
  test(name, fn) {
    const t = new Test(name);
    fn(t);
  },
};


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const core = __webpack_require__(31);
const transformations = __webpack_require__(32);
const operations = __webpack_require__(33);

const submodules = [
  'provider', 'cursor',
  'memory.provider', 'memory.cursor',
  'remote.provider', 'remote.cursor',
  'fs.provider', 'fs.cursor',
  'mongodb.provider', 'mongodb.cursor',
  'indexeddb.provider', 'postponed.cursor',
];

const lib = {};
submodules.forEach(name => Object.assign(lib, __webpack_require__(34)("./" + name)));

function GlobalStorage() {
  this.memory = new lib.MemoryProvider();
  this.local = null;
  this.remotes = {};
  this.active = false;
  this.offline = true;
  this.infrastructure = {};
  this.infrastructureTree = {};
  this.infrastructureIndex = [];
  this.infrastructureMask = 0;
  this.nextId = 0;
  this.categories = {};
}

common.inherits(GlobalStorage, lib.StorageProvider);

const gs = Object.assign(new GlobalStorage(), lib);
module.exports = gs;

gs.providers = {
  fs: gs.FsProvider,
  memory: gs.MemoryProvider,
  mongodb: gs.MongodbProvider
};

gs.cursors = {
  fs: gs.FsCursor,
  memory: gs.MemoryCursor,
  mongodb: gs.MongodbCursor
};

gs.transformations = transformations;
gs.operations = operations;

GlobalStorage.prototype.open = function(
  // Open database
  options, // options
  callback // callback
) {
  this.memory.open({ gs: options.gs });
  const providerName = options.provider || 'memory';
  const Provider = gs.providers[providerName];
  this.local = new Provider();
  this.active = true;
  this.local.open(options, callback);
};

GlobalStorage.prototype.connect = function(
  // Connect to Global Storage server
  options, // connection parammeters
  // Example: { url: 'gs://user:password@host:port/database' }
  callback // on connect function(err, connection)
) {
  const connection = new gs.RemoteProvider(options);
  callback(null, connection);
};

GlobalStorage.prototype.category = function(
  // Get Category
  name, // name of category
  callback // function(err, category)
) {
  let cat = this.categories[name];
  if (!cat) {
    cat = new core.Category(name);
    this.categories[name] = cat;
  }
  callback(null, cat);
};

GlobalStorage.prototype.get = function(
  // Get object by id
  id, // object id
  callback // function(err, object)
) {
  const get = (id, callback) => {
    this.local.get(id, (err, data) => {
      if (!err) {
        callback(null, data);
        return;
      }
      const sid = this.findServer(id);
      const connection = this.infrastructure.index[sid];
      connection.get(id, callback);
    });
  };

  this.memoryStorageProvider.get(id, (err, data) => {
    if (data) callback(null, data);
    else get(id, callback);
  });
};

GlobalStorage.prototype.create = function(
  // Create new object
  obj, // object
  callback // function(err, id)
) {
  this.local.create(obj, callback);
};

GlobalStorage.prototype.update = function(
  // Update Object
  obj, // object
  callback // function(err)
) {
  this.local.update(obj, callback);
};

GlobalStorage.prototype.delete = function(
  // Delete object
  id, // object id
  callback // function(err)
) {
  this.local.delete(id, callback);
};

GlobalStorage.prototype.select = function(
  // Select dataset
  query, // object
  options, // object
  callback // function(err, cursor)
) {
  return this.local.select(query, options, callback);
};

GlobalStorage.prototype.index = function(
  // Create index
  def, // declarative definotion
  callback // function(err)
) {
  this.local.index(def, callback);
};

GlobalStorage.prototype.infrastructureAssign = function(
  // Assign new infrastructure tree
  tree // new infrastructure tree
) {
  this.infrastructure.servers = tree;
  const index = core.buildIndex(tree);
  this.infrastructure.index = index;
  this.infrastructure.bits = Math.log(index.length) / Math.log(2);
  this.infrastructure.mask = Math.pow(2, this.infrastructure.bits) - 1;
};

GlobalStorage.prototype.findServer = function(
  // Get server for id
  id // object id
) {
  const prefix = id & this.infrastructure.mask;
  return this.infrastructure.index[prefix];
};

GlobalStorage.prototype.generateId = function(
  // Get server for id
  // This function not used now
) {
  return this.nextId++;
};



/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const NOT_IMPLEMENTED = 'Not implemented';

const Category = function(name) {
  this.name = name;
};

const buildIndex = (
  // Build index array from tree
  tree
) => {
  const result = [];
  const parseTree = (index, depth, node) => {
    const isBranch = !!node[0];
    if (isBranch) {
      parseTree(index, depth + 1, node[0]);
      parseTree(index + (1 << depth), depth + 1, node[1]);
    } else {
      result[index] = node;
    }
  };
  parseTree(0, 0, tree);

  const height = Math.ceil(Math.log(result.length) / Math.log(2));
  let i, j, depth;
  for (i = result.length; i >= 0; i--) {
    depth = Math.ceil(Math.log(i + 1) / Math.log(2));
    for (j = 1; result[i] && j < 1 << height - depth; j++) {
      if (!result[i + (j << depth)]) {
        result[i + (j << depth)] = result[i];
      }
    }
  }
  return result;
};

module.exports = {
  buildIndex,
  Category,
  NOT_IMPLEMENTED
};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const row = (
  // Get dataset row
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: [1, 'Marcus']
) => {
  const result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    let key;
    for (key in obj) {
      result.push(obj[key]);
    }
  }
  return result;
};

const col = (
  // Get dataset column
  ds, // array of records, example: [ { id: 1 }, { id: 2 }, { id: 3 } ]
  field // optional, field name
  // Result: result array of records, example: [1, 2, 3]
) => {
  let result = [];
  if (Array.isArray(ds) && ds.length > 0) {
    field = field || Object.keys(ds[0])[0];
    result = ds.map(record => record[field]);
  }
  return result;
};

const header = (
  // Get dataset header
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: ['id', 'name']
) => {
  if (Array.isArray(ds) && ds.length > 0) {
    const obj = ds[0];
    return Object.keys(obj);
  } else {
    return [];
  }
};

const projection = (
  // Dataset projection
  meta, // projection metadata, example: ['name']
  ds // array of records, example: [ { id: 1, name: 'Marcus' } ]
  // Result: result array of records, example: [ { name: 'Marcus' } ]
) => {
  const fields = meta;
  return ds.map((record) => {
    const row = {};
    fields.forEach((field) => {
      row[field] = record[field];
    });
    return row;
  });
};

const union = (
  // Set union
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: array of records, example: [ { id: 1 }, { id: 2 }, { id: 3 } ]
) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  let i, item;
  for (i = 0; i < l1; i++) {
    item = ds1[i];
    ids.push(item.id);
    ds.push(item);
  }
  for (i = 0; i < l2; i++) {
    item = ds2[i];
    if (ids.indexOf(item.id) < 0) {
      ids.push(item.id);
      ds.push(item);
    }
  }
  return ds;
};

const intersection = (
  // Set intersection
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 2 } ]
) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  let i, item;
  for (i = 0; i < l1; i++) {
    item = ds1[i];
    ids.push(item.id);
  }
  for (i = 0; i < l2; i++) {
    item = ds2[i];
    if (ids.indexOf(item.id) >= 0) {
      ds.push(item);
    }
  }
  return ds;
};

const difference = (
  // Set difference
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 1 } ]
) => {
  const ds = [];
  const ids = [];
  const l1 = ds1.length;
  const l2 = ds2.length;
  let i, item;
  for (i = 0; i < l2; i++) {
    item = ds2[i];
    ids.push(item.id);
  }
  for (i = 0; i < l1; i++) {
    item = ds1[i];
    if (ids.indexOf(item.id) < 0) {
      ds.push(item);
    }
  }
  return ds;
};

const complement = (
  // Set complement
  ds1, // array of records #1, example: [ { id: 1 }, { id: 2 } ]
  ds2 // array of records #2, example: [ { id: 2 }, { id: 3 } ]
  // Result: result array of records, example: [ { id: 3 } ]
) => (
  difference(ds2, ds1)
);

const compare = (value, op, data) => {
  if (op === '=') return value === data;
  if (op === '<') return value < data;
  if (op === '>') return value > data;
  if (op === '<=') return value <= data;
  if (op === '>=') return value >= data;
  return false;
};

const condition = (def) => {
  const c0 = def[0];
  const eq = c0 === '=';
  const nt = c0 === '!';
  if (eq || nt) return [c0, def.substr(1).trim()];
  const c1 = def[1];
  const et = c1 === '=';
  const lt = c0 === '<';
  const gt = c0 === '>';
  if (lt || gt) {
    if (et) return [c0 + c1, def.substr(2).trim()];
    else return [c0, def.substr(1).trim()];
  }
  return ['=', def];
};

const constraints = (defs, prepare = condition) => {
  const keys = Object.keys(defs);
  const prepared = {};
  let i, key, def;
  const len = keys.length;
  for (i = 0; i < len; i++) {
    key = keys[i];
    def = defs[key];
    prepared[key] = prepare(def);
  }
  return prepared;
};

module.exports = {
  row,
  col,
  header,
  projection,
  union,
  intersection,
  difference,
  complement,
  compare,
  condition,
  constraints
};


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const transformations = __webpack_require__(32);

const select = (operation, dataset) => {
  const query = operation.query;
  const constraints = transformations.constraints(query);
  const fields = Object.keys(query);
  const compare = transformations.compare;
  return dataset.filter(record => {
    let i, field, value, op, data, keep;
    for (i = 0; i < fields.length; i++) {
      field = fields[i];
      value = record[field];
      [op, data] = constraints[field];
      keep = compare(value, op, data);
      if (!keep) return false;
    }
    return true;
  });
};

const distinct = (operation, dataset) => {
  const keys = new Set();
  let fields = operation.fields;
  if (typeof(operation) === 'string') fields = [fields];
  return dataset.filter((record) => {
    const cols = fields || Object.keys(record).sort();
    const key = cols.map(field => record[field]).join('\x00');
    const has = keys.has(key);
    keys.add(key);
    return !has;
  });
};

const order = (operation, dataset) => {
  let fields = operation.fields;
  if (typeof(operation) === 'string') fields = [fields];
  dataset.sort((r1, r2) => {
    const a1 = fields.map(field => r1[field]).join('\x00');
    const a2 = fields.map(field => r2[field]).join('\x00');
    if (a1 < a2) return -1;
    if (a1 > a2) return 1;
    return 0;
  });
  return dataset;
};

const desc = (operation, dataset) => {
  let fields = operation.fields;
  if (typeof(operation) === 'string') fields = [fields];
  dataset.sort((r1, r2) => {
    const a1 = fields.map(field => r1[field]).join('\x00');
    const a2 = fields.map(field => r2[field]).join('\x00');
    if (a1 < a2) return 1;
    if (a1 > a2) return -1;
    return 0;
  });
  return dataset;
};

const projection = (operation, dataset) => (
  transformations.projection(operation.fields, dataset)
);

const row = (operation, dataset) => (
  transformations.row(dataset)
);

const col = (operation, dataset) => (
  transformations.col(dataset, operation.field)
);

const one = (operation, dataset) => (
  dataset[0]
);

const union = (operation, dataset) => (
  transformations.union(dataset, operation.cursor.dataset)
);

const intersection = (operation, dataset) => (
  transformations.intersection(dataset, operation.cursor.dataset)
);

const difference = (operation, dataset) => (
  transformations.difference(dataset, operation.cursor.dataset)
);

const complement = (operation, dataset) => (
  transformations.complement(dataset, operation.cursor.dataset)
);

module.exports = {
  select,
  distinct,
  order,
  desc,
  projection,
  row,
  col,
  one,
  union,
  intersection,
  difference,
  complement
};


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./core": 31,
	"./core.js": 31,
	"./cursor": 35,
	"./cursor.js": 35,
	"./fs.cursor": 36,
	"./fs.cursor.js": 36,
	"./fs.provider": 37,
	"./fs.provider.js": 38,
	"./indexeddb.provider": 39,
	"./indexeddb.provider.js": 39,
	"./memory.cursor": 42,
	"./memory.cursor.js": 42,
	"./memory.provider": 43,
	"./memory.provider.js": 43,
	"./mongodb.cursor": 44,
	"./mongodb.cursor.js": 44,
	"./mongodb.provider": 45,
	"./mongodb.provider.js": 45,
	"./operations": 33,
	"./operations.js": 33,
	"./postponed.cursor": 41,
	"./postponed.cursor.js": 41,
	"./provider": 40,
	"./provider.js": 40,
	"./remote.cursor": 46,
	"./remote.cursor.js": 46,
	"./remote.provider": 47,
	"./remote.provider.js": 47,
	"./transformations": 32,
	"./transformations.js": 32
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) { // check for number or string
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return id;
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 34;

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const core = __webpack_require__(31);

function Cursor() {
  this.parent = null;
  this.provider = null;
  this.dataset = [];
  this.children = [];
  this.jsql = [];
}

Cursor.prototype.copy = function(
  // Copy references to new dataset
  // Return: new Cursor instance
) {
  return new Error(core.NOT_IMPLEMENTED);
};

Cursor.prototype.clone = function(
  // Clone all dataset objects
  // Return: new Cursor instance
) {
  return new Error(core.NOT_IMPLEMENTED);
};

Cursor.prototype.enroll = function(
  // Apply JSQL commands to dataset
  jsql // commands array
  // Return: previous instance
) {
  this.jsql = this.jsql.concat(jsql);
  return this;
};

Cursor.prototype.empty = function(
  // Remove all instances from dataset
  // Return: previous instance from chain
) {
  return new Error(core.NOT_IMPLEMENTED);
};

Cursor.prototype.from = function(
  // Synchronous virtualization converts Array to Cursor
  arr // array or iterable
  // Return: new Cursor instance
) {
  if (Array.isArray(arr)) {
    return new Error(core.NOT_IMPLEMENTED);
  }
};

Cursor.prototype.map = function(
  // Lazy map
  fn // map function
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'map', fn });
  return this;
};

Cursor.prototype.projection = function(
  // Declarative lazy projection
  mapping // projection metadata array of field names
  // or structure: [ { toKey: [ fromKey, functions... ] } ]
  // Return: previous instance from chain
) {
  if (Array.isArray(mapping)) {
    // Array of field names
    this.jsql.push({ op: 'projection', fields: mapping });
  } else {
    // Object describing mappings
    this.jsql.push({ op: 'projection', metadata: mapping });
  }
  return this;
};

Cursor.prototype.filter = function(
  // Lazy functional filter
  fn // filtering function
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'filter', fn });
  return this;
};

Cursor.prototype.select = function(
  // Declarative lazy filter
  query // filter expression
  // Return: new Cursor instance
) {
  const cursor = new Cursor.MemoryCursor();
  cursor.parent = this;
  cursor.jsql.push({ op: 'select', query });
  return cursor;
};

Cursor.prototype.distinct = function(
  // Lazy functional distinct filter
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'distinct' });
  return this;
};

Cursor.prototype.find = function(
  // Lazy functional find (legacy)
  query, // find expression
  options // find options
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'find', query, options });
  return this;
};

Cursor.prototype.sort = function(
  // Lazy functional sort
  fn // compare function
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'sort', fn });
  return this;
};

Cursor.prototype.order = function(
  // Declarative lazy ascending sort
  fields // field name or array of names
  // Return: previous instance from chain
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'order', fields });
  return this;
};

Cursor.prototype.desc = function(
  // Declarative lazy descending sort
  fields // field name or array of names
  // Return: previous instance from chain
) {
  if (typeof(fields) === 'string') fields = [fields];
  this.jsql.push({ op: 'desc', fields });
  return this;
};

Cursor.prototype.count = function(
  // Calculate count async
  done // callback on done function(err, count)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.sum = function(
  // Calculate sum async
  done // callback on done function(err, sum)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.avg = function(
  // Calculate avg async
  done // callback on done function(err, avg)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.max = function(
  // Calculate max async
  done // callback on done function(err, max)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.min = function(
  // Calculate min async
  done // callback on done function(err, min)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.median = function(
  // Calculate median async
  done // callback on done function(err, median)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.mode = function(
  // Calculate mode async
  done // callback on done function(err, mode)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.col = function(
  // Convert first column of dataset to Array
  done // callback on done function(err, mode)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.row = function(
  // Return first row from dataset
  done // callback on done function(err, mode)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

Cursor.prototype.one = function(
  // Get single first record from dataset
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'one' });
  return this;
};

Cursor.prototype.limit = function(
  // Get first n records from dataset
  n // Number
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'limit', count: n });
  return this;
};

Cursor.prototype.union = function(
  // Calculate union and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'union', cursor });
  return this;
};

Cursor.prototype.intersection = function(
  // Calculate intersection and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'intersection', cursor });
  return this;
};

Cursor.prototype.difference = function(
  // Calculate difference and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'difference', cursor });
  return this;
};

Cursor.prototype.complement = function(
  // Calculate complement and put results to this Cursor instance
  cursor // Cursor instance
  // Return: previous instance from chain
) {
  this.jsql.push({ op: 'complement', cursor });
  return this;
};

Cursor.prototype.fetch = function(
  // Get results after allying consolidated jsql
  done // callback function(err, dataset)
  // Return: previous instance from chain
) {
  done = common.once(done);
  done(new Error(core.NOT_IMPLEMENTED));
  return this;
};

module.exports = { Cursor };


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const { Cursor } = __webpack_require__(35);

function FsCursor() {
  Cursor.call(this);
}

common.inherits(FsCursor, Cursor);

module.exports = { FsCursor };


/***/ }),
/* 37 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 38 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-env browser */

const common = __webpack_require__(4);
const metasync = __webpack_require__(1);
const { StorageProvider } = __webpack_require__(40);
const { PostponedCursor } = __webpack_require__(41);

function IndexedDBProvider() {}

common.inherits(IndexedDBProvider, StorageProvider);

const completeOptions = (opts = {}) => {
  let indexedDB = null;
  if (window) {
    indexedDB = window.indexedDB || window.mozIndexedDB ||
      window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  }
  if (!opts.indexedDB && !indexedDB) {
    return {
      err: new Error('There is no window.indexedDb and options.indexedDb')
    };
  }
  opts.indexedDB = opts.indexedDB || indexedDB;
  opts.databaseName = opts.databaseName || 'IndexedDBProviderDatabaseName';
  opts.storeName = opts.storeName || 'IndexedDBProviderStoreName';
  opts.idLabel = opts.idLabel || 'IndexedDBProvider_ID_Label';
  return { opts };
};

IndexedDBProvider.prototype.open = function(options, callback) {
  StorageProvider.prototype.open.call(this, options, () => {
    const { opts, err } = completeOptions(options);
    if (err) return callback(err);
    const request = opts.indexedDB.open(opts.databaseName);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(opts.storeName);
    };
    request.onsuccess = () => {
      this.db = request.result;
      this.get(opts.idLabel, (err, obj) => {
        if (err) return callback(err);
        if (obj) return callback(null);
        const tx = this.db.transaction(this.options.storeName, 'readwrite');
        const store = tx.objectStore(this.options.storeName);
        store.add({ idCounter: 0 }, opts.idLabel);
        tx.oncomplete = () => callback(null);
        tx.onerror = () => callback(tx.error);
      });
    };
    request.onerror = () => callback(request.error);
    this.request = request;
    this.options = opts;
  });
};

IndexedDBProvider.prototype.close = (callback) => {
  this.db.close();
  common.once(callback)(null);
};

IndexedDBProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  const tx = this.db.transaction(this.options.storeName, 'readwrite');
  const store = tx.objectStore(this.options.storeName);
  const idReq = store.get(this.options.idLabel);
  idReq.onsuccess = () => {
    const { idCounter } = idReq.result;
    const request = store.put({ idCounter: idCounter + 1 },
      this.options.idLabel);
    request.onsuccess = () => callback(null, idCounter);
    request.onerror = () => callback(request.error);
  };
  idReq.onerror = () => callback(idReq.error);
};

IndexedDBProvider.prototype.get = function(id, callback) {
  const tx = this.db.transaction(this.options.storeName);
  const store = tx.objectStore(this.options.storeName);
  const request = store.get(id);
  request.onerror = () => callback(request.error);
  request.onsuccess = () => {
    if (request.result === null || typeof(request.result) !== 'object') {
      return callback(null, request.result);
    }
    const obj = { id };
    Object.assign(obj, request.result);
    callback(null, obj);
  };
  return store;
};

IndexedDBProvider.prototype.create = function(obj, callback) {
  this.generateId((err, id) => {
    if (err) return callback(err);
    const tx = this.db.transaction(this.options.storeName, 'readwrite');
    const store = tx.objectStore(this.options.storeName);
    const request = store.add(obj, id);
    request.onerror = () => callback(request.error);
    request.onsuccess = () => callback(null, id);
  });
};

IndexedDBProvider.prototype.update = function(obj, callback) {
  const tx = this.db.transaction(this.options.storeName, 'readwrite');
  const store = tx.objectStore(this.options.storeName);
  const id = obj.id;
  delete obj.id;
  const request = store.put(obj, id);
  request.onerror = () => callback(request.error);
  request.onsuccess = () => {
    obj.id = id;
    callback(null, request.result);
  };
};

IndexedDBProvider.prototype.delete = function(id, callback) {
  const tx = this.db.transaction(this.options.storeName, 'readwrite');
  const store = tx.objectStore(this.options.storeName);
  const request = store.delete(id);
  request.onerror = () => callback(request.error);
  request.onsuccess = () => callback(null, request.result);
};

IndexedDBProvider.prototype.getAll = function(store, done) {
  const request = store.getAll();
  request.onerror = () => done(request.error);
  request.onsuccess = () => done(null, request.result);
};

const getAll = (store) => (data, done) => {
  const request = store.getAll();
  request.onerror = () => done(request.error);
  request.onsuccess = () => done(null, { all: request.result });
};

const getAllKeys = (store) => (data, done) => {
  const request = store.getAllKeys();
  request.onerror = () => done(request.error);
  request.onsuccess = () => done(null, { allKeys: request.result });
};

IndexedDBProvider.prototype.select = function(query, options) {
  const cursor = new PostponedCursor();
  cursor.provider = this;
  cursor.jsql.push({ op: 'select', query, options });

  const tx = this.db.transaction(this.options.storeName);
  const store = tx.objectStore(this.options.storeName);
  metasync([getAll(store), getAllKeys(store)])((err, data) => {
    const { all, allKeys } = data;
    const res = new Array(allKeys.length - 1);
    let j = 0;
    for (let i = 0; i < allKeys.length; i++) {
      if (allKeys[i] === this.options.idLabel) continue;
      const obj = all[i];
      obj.id = allKeys[i];
      res[j] = obj;
      j++;
    }
    cursor.resolve(res);
  });
  return cursor;
};

module.exports = { IndexedDBProvider };


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const core = __webpack_require__(31);

function StorageProvider(
  // Abstract Storage Provider
) {}

StorageProvider.prototype.open = function(
  // Open storage provider
  options, // object
  callback // callback function after open
) {
  callback = common.once(callback);
  this.options = options;
  if (options) {
    this.gs = options.gs;
    this.db = options.db;
    this.client = options.client;
  }
  callback();
};

StorageProvider.prototype.close = function(
  // Close storage provider
  callback // callback function after close
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.category = function(
  // Create category to access objects in it
  name // category name
  // Return: Category instance
) {
  return { name };
};

StorageProvider.prototype.generateId = function(
  callback // function(err, id)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.get = function(
  // Get object from Global Storage
  id, // globally unique object id
  callback // function(err, obj)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.create = function(
  // Create object in Global Storage
  obj, // object to be stored
  callback // function(err, id)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.update = function(
  // Update object in Global Storage
  obj, // { id } object with globally unique object id
  callback // function(err)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.delete = function(
  // Delete object in Global Storage
  id, // globally unique object id
  callback // function(err)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.select = function(
  // Select objects from Global Storage
  query, // JSQL lambda expression
  options, // { order, limit }
  // order - order key field name
  // limit - top n records
  callback // function(err, data)
  // data - array of object
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

StorageProvider.prototype.index = function(
  // Create index
  def, // { category, fields, unique, background }
  // category - category name
  // fields - array of field names
  // unique - bool flag, default false
  // background - bool flag, default true
  callback // function(err)
) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

module.exports = { StorageProvider };


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);
const { MemoryCursor } = __webpack_require__(42);

function PostponedCursor() {
  MemoryCursor.call(this, null);
  this.ds = new Promise((res, rej) => {
    this.dsResolve = res;
    this.dsReject = rej;
  });
}

common.inherits(PostponedCursor, MemoryCursor);

PostponedCursor.prototype.resolve = function(ds) {
  this.dsResolve(ds);
};

PostponedCursor.prototype.reject = function(err) {
  this.dsReject(err);
};

PostponedCursor.prototype.fetch = function(done) {
  this.ds.then(ds => {
    this.dataset = ds;
    MemoryCursor.prototype.fetch.call(this, done);
  });
};

module.exports = { PostponedCursor };


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const operations = __webpack_require__(33);
const { Cursor } = __webpack_require__(35);

function MemoryCursor(dataset) {
  Cursor.call(this);
  this.dataset = dataset;
  this.indices = {};
}

common.inherits(MemoryCursor, Cursor);
Cursor.MemoryCursor = MemoryCursor;

MemoryCursor.prototype.copy = function() {
  const dataset = common.copy(this.dataset);
  return new MemoryCursor(dataset);
};

MemoryCursor.prototype.clone = function() {
  const dataset = common.clone(this.dataset);
  return new MemoryCursor(dataset);
};

MemoryCursor.prototype.empty = function() {
  this.dataset.length = 0;
  this.jsql.length = 0;
  return this;
};

MemoryCursor.prototype.from = function(arr) {
  this.dataset = common.copy(arr);
  return this;
};

MemoryCursor.prototype.count = function(done) {
  done = common.once(done);
  done(null, this.dataset.length);
  return this;
};

MemoryCursor.prototype.fetch = function(done) {
  done = common.once(done);

  const process = dataset => {
    this.jsql.forEach(operation => {
      const fn = operations[operation.op];
      if (fn) {
        dataset = fn(operation, dataset);
      }
    });
    this.jsql.length = 0;
    done(null, dataset);
  };

  if (this.parent) {
    this.parent.fetch((err, dataset) => process(dataset));
  } else {
    const dataset = common.clone(this.dataset);
    process(dataset);
  }
  return this;
};

module.exports = { MemoryCursor };


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const core = __webpack_require__(31);
const { StorageProvider } = __webpack_require__(40);

function MemoryProvider() {
  StorageProvider.call(this);
}

common.inherits(MemoryProvider, StorageProvider);

MemoryProvider.prototype.open = function(options, callback) {
  StorageProvider.prototype.open.call(this, options, callback);
};

MemoryProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  callback();
};

MemoryProvider.prototype.category = function(name) {
  return { name };
};

MemoryProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.dataset.push(obj);
  callback();
};

MemoryProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.delete = function(id, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

MemoryProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  callback(new Error(core.NOT_IMPLEMENTED));
};

module.exports = { MemoryProvider };


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const transformations = __webpack_require__(32);
const operations = __webpack_require__(33);
const { Cursor } = __webpack_require__(35);

function MongodbCursor(cursor) {
  Cursor.call(this);
  this.cursor = cursor;
}

common.inherits(MongodbCursor, Cursor);

MongodbCursor.prototype.clone = function() {
  const mc = this.cursor.clone();
  const cursor = new MongodbCursor(mc);
  cursor.provider = this.provider;
  cursor.parent = this.parent;
  cursor.jsql = common.clone(this.jsql);
  return cursor;
};

MongodbCursor.prototype.modify = function(changes, done) {
  done = common.once(done);
  if (this.jsql.length > 0) {
    const select = this.jsql[0];
    if (select.op === 'select') {
      const category = this.provider.category(select.query.category);
      category.updateMany(select.query, { $set: changes }, { w: 1 }, done);
    }
  }
};

MongodbCursor.prototype.projection = function(mapping) {
  const fields = this.provider.fields(mapping);
  fields._id = 1;
  this.cursor.project(fields);
  return this;
};

MongodbCursor.prototype.order = function(by) {
  if (!Array.isArray(by)) by = [by];
  const fields = this.provider.fields(by);
  this.cursor.sort(fields);
  return this;
};

MongodbCursor.prototype.limit = function(n) {
  this.cursor.limit(n);
  return this;
};

MongodbCursor.prototype.fetch = function(done) {
  done = common.once(done);
  this.cursor.toArray((err, dataset) => {
    if (err) {
      done(err);
      return;
    }
    this.jsql.forEach(operation => {
      const fn = operations[operation.op];
      if (fn) {
        dataset = fn(operation, dataset);
      }
    });
    this.jsql.length = 0;
    done(null, dataset);
    return this;
  });
  return this;
};

MongodbCursor.prototype.next = function(done) {
  done = common.once(done);
  this.cursor.nextObject((err, record) => {
    if (err) {
      done(err);
      return;
    }
    let data = [record];
    this.jsql.forEach((item) => {
      if (item.op === 'projection') {
        data = transformations.projection(item.fields, data);
      } else if (item.op === 'row') {
        data = transformations.row(data);
      } else if (item.op === 'col') {
        data = transformations.col(data);
      } else if (item.op === 'one') {
        data = data[0];
      }
    });
    done(null, data[0]);
  });
  return this;
};

module.exports = { MongodbCursor };


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {

const common = __webpack_require__(4);

const transformations = __webpack_require__(32);
const { StorageProvider } = __webpack_require__(40);
const { MongodbCursor } = __webpack_require__(44);

const DUPLICATE_KEY = 11000;

const constraints = defs => transformations.constraints(defs, def => {
  const c0 = def[0];
  const eq = c0 === '=';
  const nt = c0 === '!';
  if (eq || nt) {
    const val = def.substr(1).trim();
    const value = parseFloat(val) || val;
    if (eq) return value;
    if (nt) return { $ne: value };
  }
  const c1 = def[1];
  const et = c1 === '=';
  const lt = c0 === '<';
  const gt = c0 === '>';
  if (lt || gt) {
    if (et) {
      const val = def.substr(2).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lte: value };
      else return { $gte: value };
    } else {
      const val = def.substr(1).trim();
      const value = parseFloat(val) || val;
      if (lt) return { $lt: value };
      else return { $gt: value };
    }
  }
  return def;
});

function MongodbProvider() {
  StorageProvider.call(this);
  this.stat = null;
}

common.inherits(MongodbProvider, StorageProvider);

MongodbProvider.prototype.open = function(options, callback) {
  callback = common.once(callback);
  StorageProvider.prototype.open.call(this, options, () => {
    if (this.db) {
      this.storage = this.db.collection('gsStorage');
      this.metadata = this.db.collection('gsMetadata');
      this.metadata.findOne({ _id: 0 }, (err, data) => {
        if (data) {
          delete data._id;
          //this.gs.infrastructure.assign(data.tree);
          this.stat = data;
          callback();
        } else {
          const metadata = { _id: 0, next: 0, tree: {} };
          this.metadata.insertOne(metadata, callback);
        }
      });
    }
  });
};

MongodbProvider.prototype.close = function(callback) {
  callback = common.once(callback);
  if (this.client) this.client.close(callback);
  else callback();
};

MongodbProvider.prototype.category = function(name) {
  return this.db.collection('c' + name);
};

MongodbProvider.prototype.generateId = function(callback) {
  callback = common.once(callback);
  this.metadata.findAndModify(
    { _id: 0 }, null,
    { $inc: { next: 1 } },
    { upsert: true, new: true },
    (err, res) => {
      if (err) {
        if (err.code === DUPLICATE_KEY) {
          process.nextTick(() => {
            this.generateId(callback);
          });
        } else {
          callback(err);
        }
        return;
      }
      callback(null, res.value.next);
    }
  );
};

MongodbProvider.prototype.get = function(id, callback) {
  callback = common.once(callback);
  this.storage.findOne({ _id: id }, (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    const category = this.category(data.category);
    category.findOne({ _id: id }, (err, data) => {
      if (data) data.id = data._id;
      callback(err, data);
    });
  });
};

MongodbProvider.prototype.create = function(obj, callback) {
  callback = common.once(callback);
  this.generateId((err, id) => {
    if (err) {
      callback(err);
      return;
    }
    obj._id = id;
    obj.id = id;
    const index = { _id: id, category: obj.category };
    this.storage.insertOne(index, (err) => {
      if (err) {
        callback(err);
        return;
      }
      const category = this.category(obj.category);
      category.insertOne(obj, (err) => {
        if (err) callback(err);
        else callback(null, id);
      });
    });
  });
};

MongodbProvider.prototype.update = function(obj, callback) {
  callback = common.once(callback);
  obj._id = obj.id;
  this.storage.findOne({ _id: obj._id }, (err, data) => {
    if (err) {
      callback(err);
      return;
    }
    const category = this.category(data.category);
    category.updateOne(
      { _id: obj._id }, obj, { upsert: true, w: 1 }, callback
    );
  });
};

MongodbProvider.prototype.delete = function(query, callback) {
  callback = common.once(callback);
  const qtype = typeof(query);
  if (qtype === 'object') {
    if (query.category) {
      const category = this.category(query.category);
      category.deleteMany(query);
      this.storage.deleteMany(query, callback);
      return;
    }
  }
  if (qtype === 'number') {
    this.storage.findOne({ _id: query }, (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      const category = this.category(data.category);
      category.deleteOne({ _id: query });
      this.storage.deleteOne({ _id: query }, callback);
    });
  }
  callback(new Error('Nothing to delete'));
};

MongodbProvider.prototype.select = function(query, options, callback) {
  const category = this.category(query.category);
  const prepared = constraints(query);
  delete prepared.category;
  const cursor = category.find(prepared);
  if (callback) {
    cursor.toArray((err, data) => {
      if (err) {
        callback(err);
        return;
      }
      data.forEach((obj) => {
        obj.id = obj._id;
      });
      callback(null, data);
    });
  } else {
    const mc = new MongodbCursor(cursor);
    mc.provider = this;
    mc.jsql.push({ op: 'select', query, options });
    return mc;
  }
};

MongodbProvider.prototype.fields = (list) => {
  const fields = {};
  list.forEach(field => fields[field] = 1);
  return fields;
};

MongodbProvider.prototype.index = function(def, callback) {
  callback = common.once(callback);
  const category = this.category(def.category);
  const keys = this.fields(def.fields);
  const options = {
    unique: def.unique !== undefined ? def.unique : false,
    sparse: def.nullable !== undefined ? def.nullable : false,
    background: def.background !== undefined ? def.background : true
  };
  category.createIndex(keys, options, callback);
};

module.exports = { MongodbProvider };

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(10)))

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const { Cursor } = __webpack_require__(35);

function RemoteCursor() {
  Cursor.call(this);
}

common.inherits(RemoteCursor, Cursor);

module.exports = { RemoteCursor };


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const common = __webpack_require__(4);

const { StorageProvider } = __webpack_require__(40);

function RemoteProvider() {
  StorageProvider.call(this);
}

common.inherits(RemoteProvider, StorageProvider);

module.exports = { RemoteProvider };


/***/ })
/******/ ]);