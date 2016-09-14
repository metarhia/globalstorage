let net = require('net'),
    vm = require('vm'),
    { remotePort, remoteHost } = require('./cConfig');
    
let api = require('./api')('jstp', 'gen', 'data.generation');

if (process.argv.length > 2) {
  remotePort = process.argv[2];
}
if (process.argv.length > 3) {
  remoteHost = process.argv[3];
}

let objects = [],
    config = {
      objLifeLen: normDistGen(60000, 20000),
      objSpawnCooldown: normDistGen(1000, 200),
    },
    dataAll = '';

const client = net.connect(remotePort, remoteHost, () => {
  setTimeout(spawnObj, 0, client, config, api.data.generation.objGen());  
});

client.on('data', data => {
  dataAll += data;
});

client.on('end', () => {
  console.log('Server disconnected');
});

function spawnObj(conn, config, objGen) {
  let { objSpawnCooldown, objLifeLen } = config,
      obj = {
        type: 'create',
        data: objGen.next().value,
      };
  console.log(obj);
  client.write(api.jstp.serialize(obj));
  client.write('\0');
  setTimeout(spawnObj, objSpawnCooldown.next().value, conn, config, objGen);
}

function distGen(func, left, right) {
  return api.gen.makeGen(() => {
    return func(left + Math.random() * (right - left));
  });
}

function normDistGen(mean, disp) {
  return distGen(x => {
    let y, s;
    genVals();
    while (s > 1.0 || s == 0.0) {
      x = Math.random() * 2 - 1;
      genVals();
    }
    let r = Math.sqrt(-2 * Math.log(s) / s);
    return r * x * disp + mean;

    function genVals() {
      y = Math.random() * 2 - 1;
      s = x*x + y*y;
    }
  }, -1, 1);
}

function erf(x) {
  let pi = Math.PI,
      a = 8 * (3 - pi) / 3 / pi / (pi - 4);
  return Math.sqrt( 1 - Math.exp(-x*x*(4/pi + a*x*x)/(1 + a*x*x)));
}
