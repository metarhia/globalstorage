'use strict';

class SyncManager {
  #nodes = new Map();

  constructor() {
    return this.#init();
  }

  async #init() {
    await this.start();
    return this;
  }

  async start() {
    // TODO: Implement metacom-based sync (WebSocket client)
    // Future: WebRTC transport for peer-to-peer sync
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
    await this.start();
  }

  async removeNode(url) {
    if (!this.#nodes.delete(url)) {
      throw new Error(`Node with URL ${url} not found`);
    }
  }

  listNodes() {
    return [...this.#nodes.values()];
  }
}

module.exports = { SyncManager };
