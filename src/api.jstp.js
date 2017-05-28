const util = require('util'),
      vm = require('vm');

function parse(s) {
  var sandbox = vm.createContext({});
  var js = vm.createScript('(' + s + ')');
  return js.runInNewContext(sandbox);
}

let serializeFuncs = {
  number(x) { return x + ''; },
  string(s) { return '\'' + s.replace('\'', '\\\'') + '\''; },
  boolean(b) { return b ? 'true' : 'false'; },
  undefined(u, arr) { return !!arr ? '' : 'undefined'; },
  array(a) { return '[' + a.map(serialize).join(',') + ']'; },
  object(obj) {
    var a = [], s, key;
    for (key in obj) {
      s = serialize(obj[key]);
      if (s !== 'undefined') {
        a.push(key + ':' + s);
      }
    }
    return '{' + a.join(',') + '}';
  },
};

function serialize(obj) {
  return obj === null
       ? 'null'
       : Array.isArray(obj)
       ? serializeFuncs['array'](obj)
       : serializeFuncs[typeof obj](obj);
}

const packSep = '\0',
      packSepLen = packSep.length;

function addPacketHandler(sock, handler) {
  let dataAll = new Buffer([]);

  sock.on('data', data => {
    dataAll = Buffer.concat([dataAll, data]);
    let ind = dataAll.indexOf(packSep);
    while (ind !== -1) {
      let packet = dataAll.slice(0, ind),
          packetObj = parse(packet.toString()),
          res = handler(packetObj);
      dataAll = dataAll.slice(ind + packSepLen);
      if (res !== undefined) {
        let info = serialize(res);
        sock.write(info);
        sock.write('\0');
      }
      ind = dataAll.indexOf(packSep);
    }
  });
}

function addEventHandlers(sock, handlers) {
  addPacketHandler(sock, function(packet) {
    return handlers[packet.type](packet.data);   
  });
}

function sendPacket(sock, packetObj) {
  let info = serialize(packetObj);
  sock.write(info);
  sock.write(packSep);
}

function sendEvent(sock, eventName, data) {
  sendPacket(sock, { type: eventName, data });
}

module.exports = { 
  parse,
  serialize,
  addPacketHandler,
  addEventHandlers,
  sendPacket,
  sendEvent,
};
