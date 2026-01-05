'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { between } = require('metautil');

class SyncManager {
  #path;
  #nodes = new Set();

  constructor(basePath) {
    this.#path = path.join(basePath, 'remote');
    return this.#init();
  }

  async #init() {
    await fs.mkdir(this.#path, { recursive: true });
    const files = await fs.readdir(this.#path);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(this.#path, file);
      const raw = await fs.readFile(filePath, 'utf8');
      const node = JSON.parse(raw);
      this.#nodes.add(node);
    }
    await this.start();
    return this;
  }

  async start() {
    // TODO: Implement metacom-based sync
    // This would connect to the node using metacom protocol
    // and exchange CRDT delta logs for sync
    const uplinks = Array.from(this.#nodes).filter(
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
    const existing = Array.from(this.#nodes).find((n) => n.url === url);
    if (existing) throw new Error(`Node with URL ${url} already exists`);
    const now = Date.now();
    const node = { type, url, token, enabled: true, lastSync: now };
    this.#nodes.add(node);
    await fs.mkdir(this.#path, { recursive: true });
    const domain = between(url, '://', ':');
    const filePath = path.join(this.#path, `${domain}.json`);
    await fs.writeFile(filePath, JSON.stringify(node));
    await this.start();
  }

  async removeNode(url) {
    const node = Array.from(this.#nodes).find((n) => n.url === url);
    if (!node) throw new Error(`Node with URL ${url} not found`);
    this.#nodes.delete(node);
    const domain = between(url, '://', ':');
    const filePath = path.join(this.#path, `${domain}.json`);
    await fs.unlink(filePath);
  }

  listNodes() {
    return Array.from(this.#nodes);
  }
}

module.exports = { SyncManager };
