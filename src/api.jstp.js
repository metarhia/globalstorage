const util = require('util'),
      vm = require('vm');

function parse(s) {
  var sandbox = vm.createContext({});
  var js = vm.createScript('(' + s + ')');
  return js.runInNewContext(sandbox);
}

function serialize(obj) {
  return util.inspect(obj, { breakLength: Infinity });
}

module.exports = { 
  parse,
  serialize,
};
