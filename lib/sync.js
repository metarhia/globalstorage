'use strict';

const { between } = require('metautil');
const { fsi } = require('./fsi.js');

const nodeFile = (url) => `${between(url, '://', ':')}.json`;

class SyncManager {
  #path;
  #nodes = new Map();

  constructor(basePath) {
    this.#path = `${basePath}/remote`;
    return this.#init();
  }

  async #init() {
    const files = await fsi.list(this.#path);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));
    const reads = jsonFiles.map((file) => fsi.read(this.#path, file));
    for (const raw of await Promise.all(reads)) {
      const node = JSON.parse(raw);
      this.#nodes.set(node.url, node);
    }
    await this.start();
    return this;
  }

  async start() {
    // TODO: Implement metacom-based sync
    // This would connect to the node using metacom protocol
    // and exchange CRDT delta logs for sync
    // Future: WebRTC transport for peer-to-peer sync in browser
    const uplinks = this.listNodes().filter(
      (node) => node.type === 'uplink' && node.enabled,
    );
    if (uplinks.length === 0) return;
    for (const uplink of uplinks) {
      try {
        // Sync here
      } catch (error) {
        console.error(`Sync failed with ${uplink.url}:`, error.message);
      }
    }
  }

  async addNode(nodeData) {
    const { url, type, token } = nodeData;
    if (!url) throw new Error('Node URL is required');
    if (type !== 'uplink' && type !== 'downlink') {
      throw new Error('Node type must be uplink or downlink');
    }
    if (this.#nodes.has(url)) {
      throw new Error(`Node with URL ${url} already exists`);
    }
    const now = Date.now();
    const node = { type, url, token, enabled: true, lastSync: now };
    this.#nodes.set(url, node);
    await fsi.write(this.#path, nodeFile(url), JSON.stringify(node));
    await this.start();
  }

  async removeNode(url) {
    if (!this.#nodes.delete(url)) {
      throw new Error(`Node with URL ${url} not found`);
    }
    await fsi.remove(this.#path, nodeFile(url));
  }

  listNodes() {
    return [...this.#nodes.values()];
  }
}

module.exports = { SyncManager };
