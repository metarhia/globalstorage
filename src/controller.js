let net = require('net'),
    api = require('./api')('jstp', 'tree'),
    controllerConfig = require('./controllerConfig');

let servers = api.tree.empty(),
    serverSocks = api.tree.empty(),
    serversCount = 0;
net.createServer(sock => {
  let handlers = {
    add({ host, port }) {
      let addr = host + ':' + port;
      servers.insert(serversCount, addr);
      serverSocks.insert(serversCount, { addr, sock });
      serversCount++;
      return { type: 'added', data: 'ok' };
    },
    get(id) {
      let res = { type: 'got', data: servers.get(id) };
      return res;
    },
    getExactly(id) {
      let res = { type: 'gotExactly', data: servers.getExactly(id) };
      console.log(res);
      return res;
    },
    getAll() {
      let res = { type: 'gotAll', data: servers };
      return res;
    },
  };
  api.jstp.addEventHandlers(sock, handlers);

  sock.on('end', () => {});
}).listen(controllerConfig.port);
