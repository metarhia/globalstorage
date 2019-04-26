'use strict';

const { Uint64, sequence } = require('@metarhia/common');
const { StorageProvider } = require('./provider');

class RemoteServer extends StorageProvider {
  constructor({ host, ports }, providerOptions) {
    super(providerOptions);
    this.host = host;
    this.ports = ports.length > 1 ? sequence(ports, 0) : ports;
    this.pool = [];
  }
}

const SYSTEM_BITMASK_SIZE = 24;
const SYSTEM_BITMASK = new Uint64(1).shiftLeft(SYSTEM_BITMASK_SIZE).dec();

const getTreeDepth = (node, depth = 0) => {
  if (node[0] && node[1]) {
    return Math.max(
      getTreeDepth(node[0], depth + 1),
      getTreeDepth(node[1], depth + 1)
    );
  }
  return depth;
};

const compressTree = tree => {
  const result = {};
  const parseTree = (index, depth, node) => {
    const isLeaf = !node[0] || !node[1];
    if (isLeaf) {
      result[index] = node;
      return;
    }
    parseTree(index, depth + 1, node[0]);
    parseTree(index + (1 << depth), depth + 1, node[1]);
  };
  parseTree(0, 0, tree);
  return result;
};

const buildIndex = (tree, depth, serverIds) => {
  const result = new Array(Math.pow(2, depth));

  const parseTree = (index, depth, node) => {
    const isLeaf = !node[0] || !node[1];
    if (isLeaf) {
      const serverSuffix = new Uint64(index)
        .shiftLeft(SYSTEM_BITMASK_SIZE)
        .or(serverIds.systemSuffix);
      const serverBitmask = new Uint64(1)
        .shiftLeft(depth)
        .dec()
        .shiftLeft(SYSTEM_BITMASK_SIZE)
        .or(SYSTEM_BITMASK);

      result[index] = new RemoteServer(node, {
        ...serverIds,
        serverSuffix,
        serverBitmask,
      });
      for (let i = 1; ; i++) {
        const refIndex = (i << depth) | index;
        if (refIndex >= result.length) return;
        result[refIndex] = result[index];
      }
    }
    parseTree(index, depth + 1, node[0]);
    parseTree(index + (1 << depth), depth + 1, node[1]);
  };
  parseTree(0, 0, tree);

  return result;
};

class ServerTree {
  constructor(tree, systemId) {
    this.tree = tree;
    this.compressedTree = compressTree(tree);
    this.depth = getTreeDepth(this.tree);
    this.serverBitmask = new Uint64(1).shiftLeft(this.depth).dec();
    this.treeIndex = buildIndex(this.tree, this.depth, {
      systemSuffix: new Uint64(systemId),
      systemBitmask: new Uint64(SYSTEM_BITMASK),
    });
  }

  findServer(id) {
    return this.treeIndex[
      Uint64.shiftRight(id, SYSTEM_BITMASK_SIZE)
        .and(this.serverBitmask)
        .toUint32()
    ];
  }

  toJSON() {
    return this.compressedTree;
  }
}

class SystemList {
  constructor(systems) {
    this.systems = {};
    for (const id in systems) {
      this.systems[id] = new ServerTree(systems[id], new Uint64(id));
    }
  }

  findServer(id) {
    const serverTree = this.systems[Uint64.and(SYSTEM_BITMASK).toUint32()];
    if (!serverTree) {
      return null;
    }
    return serverTree.findServer(id);
  }

  toJSON() {
    return this.systems;
  }
}

module.exports = {
  RemoteServer,
  ServerTree,
  SystemList,
};
