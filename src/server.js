let net = require('net'),
    { port, 
      controllerHost, 
      controllerPort,
    } = require('./sConfig');

if (process.argv.length > 2) {
  port = process.argv[2]
} if (process.argv.length > 3) { controllerHost = process.argv[3];
} 
if (process.argv.length > 4) {
  controllerPort = process.argv[4];
}

let api = require('./api')('jstp');

let objs = [];
const handlers = {
  create(data) {
    return objs.push(data);
  },
  get(packet) {
    return objs[id];
  }
};

net.createServer(c => {
  console.log('Client connected');
  api.jstp.addEventHandlers(c, handlers);
  c.on('end', () => console.log('client disconnected'));
}).listen(port);

let client = net.connect(controllerPort, controllerHost, () => {
  api.jstp.addEventHandlers(client, {
    added() {},
    got(server) { console.log(server); },
    gotAll(servers) { console.log(api.jstp.serialize(servers)); },
    gotExactly(server) { console.log(server); },
  });
  api.jstp.sendEvent(client, 'add', {
    host: client.localAddress,
    port,
  });
  api.jstp.sendEvent(client, 'getExactly', 2);
  api.jstp.sendEvent(client, 'getAll');
});
