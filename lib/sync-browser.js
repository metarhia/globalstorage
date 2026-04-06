'use strict';

class SyncManager {
  #nodes = new Set();

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
    await this.start();
  }

  async removeNode(url) {
    const node = Array.from(this.#nodes).find((n) => n.url === url);
    if (!node) throw new Error(`Node with URL ${url} not found`);
    this.#nodes.delete(node);
  }

  listNodes() {
    return Array.from(this.#nodes);
  }
}

module.exports = { SyncManager };
