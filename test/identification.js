'use strict';

const metatests = require('metatests');
const { Uint64 } = require('@metarhia/common');

const {
  RemoteServer,
  ServerTree,
  SystemList,
} = require('../lib/identification');
const { StorageProvider } = require('../lib/provider');

const systemsSimple = {
  0: {
    0: { host: 'gs.metarhia.com', ports: [3000] },
    1: { host: 'gs.metarhia.com', ports: [3001] },
  },
  8388608: {
    0: { host: 'gs1.metarhia.com', ports: [3000] },
    1: { host: 'gs1.metarhia.com', ports: [3001] },
  },
};

const complexSystems = {
  0: {
    0: {
      0: {
        host: 'gs1.metarhia.com',
        ports: [3000, [3]],
      },
      1: {
        host: 'gs2.metarhia.com',
        ports: [2000, [2]],
      },
    },
    1: {
      0: {
        0: {
          host: 'gs3.metarhia.com',
          ports: [1337, null, 1340],
        },
        1: {
          host: 'gs4.metarhia.com',
          ports: [4000, [1]],
        },
      },
      1: {
        host: 'gs.metarhia.com',
        ports: [1234],
      },
    },
  },
};

const complexSystemsCompressed = {
  0: {
    0: {
      host: 'gs1.metarhia.com',
      ports: [3000, [3]],
    },
    1: {
      host: 'gs3.metarhia.com',
      ports: [1337, null, 1340],
    },
    2: {
      host: 'gs2.metarhia.com',
      ports: [2000, [2]],
    },
    3: {
      host: 'gs.metarhia.com',
      ports: [1234],
    },
    5: {
      host: 'gs4.metarhia.com',
      ports: [4000, [1]],
    },
  },
};

const contains = (test, object, expected) => {
  for (const key in expected) {
    if (!Object.prototype.hasOwnProperty.call(expected, key)) {
      continue;
    }
    test.strictSame(object[key], expected[key]);
  }
};

metatests.test('must load system list', test => {
  const systems = require('./fixtures/identification/systems-simple.json');

  const systemList = new SystemList(systems);

  test.strictSame(Object.keys(systemList.systems), Object.keys(systems));

  const trees = systemList.systems;
  for (const systemId in trees) {
    const expectedSystem = systemsSimple[systemId];
    test.assert(trees[systemId] instanceof ServerTree);
    test.strictSame(trees[systemId].tree, expectedSystem);
    test.strictSame(trees[systemId].compressedTree, expectedSystem);
    test.strictSame(trees[systemId].depth, 1);
    test.strictSame(trees[systemId].serverBitmask, new Uint64(1));

    const treeIndex = trees[systemId].treeIndex;
    for (let i = 0; i < treeIndex.length; i++) {
      const server = treeIndex[i];
      const expectedServer = {
        systemSuffix: new Uint64(systemId),
        systemBitmask: new Uint64(0xffffff),
        ...expectedSystem[i],
      };

      test.assert(server instanceof RemoteServer);
      test.assert(server instanceof StorageProvider);
      contains(test, server, expectedServer);
    }
  }

  const server = trees[8388608].treeIndex[0];
  test.strictSame(server.serverSuffix, new Uint64(8388608));
  test.strictSame(server.serverBitmask, new Uint64(0x1ffffff));

  test.end();
});

metatests.test('must properly load complex systems', test => {
  const systems = require('./fixtures/identification/systems-complex.json');
  const systemList = new SystemList(systems);
  const system = systemList.systems[0];
  const expectedSystem = complexSystems[0];
  const expectedSystemCompressed = complexSystemsCompressed[0];
  test.strictSame(system.tree, expectedSystem);
  test.strictSame(system.compressedTree, expectedSystemCompressed);

  const treeIndex = [
    {
      host: 'gs1.metarhia.com',
      ports: [3000, 3001, 3002],
      serverSuffix: new Uint64(0),
      serverBitmask: new Uint64(0x3ffffff),
    },
    {
      host: 'gs3.metarhia.com',
      ports: [1337, 1338, 1339, 1340],
      serverSuffix: new Uint64(0x1000000),
      serverBitmask: new Uint64(0x7ffffff),
    },
    {
      host: 'gs2.metarhia.com',
      ports: [2000, 2001],
      serverSuffix: new Uint64(0x2000000),
      serverBitmask: new Uint64(0x3ffffff),
    },
    {
      host: 'gs.metarhia.com',
      ports: [1234],
      serverSuffix: new Uint64(0x3000000),
      serverBitmask: new Uint64(0x3ffffff),
    },
    {
      host: 'gs1.metarhia.com',
      ports: [3000, 3001, 3002],
      serverSuffix: new Uint64(0),
      serverBitmask: new Uint64(0x3ffffff),
    },
    {
      host: 'gs4.metarhia.com',
      ports: [4000],
      serverSuffix: new Uint64(0x5000000),
      serverBitmask: new Uint64(0x7ffffff),
    },
    {
      host: 'gs2.metarhia.com',
      ports: [2000, 2001],
      serverSuffix: new Uint64(0x2000000),
      serverBitmask: new Uint64(0x3ffffff),
    },
    {
      host: 'gs.metarhia.com',
      ports: [1234],
      serverSuffix: new Uint64(0x3000000),
      serverBitmask: new Uint64(0x3ffffff),
    },
  ];

  for (let i = 0; i < system.treeIndex.length; i++) {
    const expected = {
      systemSuffix: new Uint64(0),
      systemBitmask: new Uint64(0xffffff),
      ...treeIndex[i],
    };
    contains(test, system.treeIndex[i], expected);
  }

  test.end();
});
