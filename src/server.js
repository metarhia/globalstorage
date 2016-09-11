const net = require('net'),
      { port } = require('./sConfig');

let api = require('./api')('jstp');

const packSep = '\0',
      packSepLen = packSep.length;

const server = net.createServer(c => {
  console.log('client connected');
  c.on('end', () => {
    console.log('client disconnected');
  });

  let dataAll = new Buffer([]);

  c.on('data', data => {
    dataAll = Buffer.concat([dataAll, data]);
    let ind = dataAll.indexOf(packSep);
    if (ind !== -1) {
      let packet = dataAll.slice(0, ind),
          packetObj = api.jstp.parse(packet.toString()),
          res = handler(packetObj);
      console.log(packetObj.data);
      dataAll = dataAll.slice(ind + packSepLen);
      c.write('' + res);
      c.write('\0');
    }
  });
}).listen(port);

server.on('error', function(err) { throw err; });

server.listen(port, () => console.log('server bound'));

let objs = [];

const handlerFuncs = {
  create(data) {
    return objs.push(data);
  },
  get(packet) {
    return obj[id];
  }
};

function handler(packet) {
  return handlerFuncs[packet.type](packet.data);   
}

