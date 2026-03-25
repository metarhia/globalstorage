'use strict';

const { calculateHash } = require('../chain.js');
const { extractTrigrams, extractRecordTrigrams } = require('./trigrams.js');

class SearchIndex {
  #storage;
  #chain;
  #index; // Map<trigram, Set<recordId>>
  #docStats; // Map<recordId, { counts: Map<trigram, count>, total: number }>
  #docCount;
  #repository;

  constructor(storage, chain, repository) {
    this.#storage = storage;
    this.#chain = chain;
    this.#index = new Map();
    this.#docStats = new Map();
    this.#docCount = 0;
    this.#repository = repository;
    return this.#init();
  }

  async #init() {
    await this.#load();
    return this;
  }

  async #load() {
    const raw = await this.#repository.load();
    if (!raw) return;
    const { data, block } = JSON.parse(raw);
    const hash = await calculateHash(data);
    const blockRecord = await this.#chain.readBlock(block);
    const valid =
      blockRecord.data.hash === hash && blockRecord.data.type === 'fts-index';
    if (!valid) throw new Error('FTS index integrity check failed');
    this.#deserialize(data);
  }

  #deserialize(data) {
    this.#docCount = data.docCount;
    this.#index = new Map(
      Object.entries(data.index).map(([trigram, ids]) => [
        trigram,
        new Set(ids),
      ]),
    );
    this.#docStats = new Map(
      Object.entries(data.docStats).map(([id, stats]) => [
        id,
        {
          counts: new Map(Object.entries(stats.counts)),
          total: stats.total,
        },
      ]),
    );
  }

  #serialize() {
    return {
      docCount: this.#docCount,
      index: Object.fromEntries(
        Array.from(this.#index, ([trigram, ids]) => [trigram, [...ids]]),
      ),
      docStats: Object.fromEntries(
        Array.from(this.#docStats, ([id, { counts, total }]) => [
          id,
          { counts: Object.fromEntries(counts), total },
        ]),
      ),
    };
  }

  async #save() {
    const data = this.#serialize();
    const hash = await calculateHash(data);
    const blockHash = await this.#chain.addBlock({ type: 'fts-index', hash });
    const entry = { data, timestamp: Date.now(), block: blockHash };
    await this.#repository.save(JSON.stringify(entry));
  }

  #removeFromIndex(id) {
    const stats = this.#docStats.get(id);
    if (!stats) return;
    for (const trigram of stats.counts.keys()) {
      const ids = this.#index.get(trigram);
      if (!ids) continue;
      ids.delete(id);
      if (ids.size === 0) this.#index.delete(trigram);
    }
    this.#docStats.delete(id);
    this.#docCount--;
  }

  #indexRecord(id, data) {
    this.#removeFromIndex(id);
    const counts = extractRecordTrigrams(data);
    if (counts.size === 0) return;
    let total = 0;
    for (const [trigram, count] of counts) {
      total += count;
      let ids = this.#index.get(trigram);
      if (!ids) {
        ids = new Set();
        this.#index.set(trigram, ids);
      }
      ids.add(id);
    }
    this.#docStats.set(id, { counts, total });
    this.#docCount++;
  }

  async index(id, data) {
    this.#indexRecord(id, data);
    await this.#save();
  }

  async remove(id) {
    if (!this.#docStats.has(id)) return;
    this.#removeFromIndex(id);
    await this.#save();
  }

  search(query, limit = 10) {
    const queryTrigrams = new Set(extractTrigrams(query));
    if (queryTrigrams.size === 0 || this.#docCount === 0) return [];
    const scores = new Map();
    for (const trigram of queryTrigrams) {
      const matchingIds = this.#index.get(trigram);
      if (!matchingIds) continue;
      const idf = Math.log(this.#docCount / matchingIds.size);
      for (const id of matchingIds) {
        const { counts, total } = this.#docStats.get(id);
        const tf = (counts.get(trigram) || 0) / total;
        scores.set(id, (scores.get(id) || 0) + tf * idf);
      }
    }
    return Array.from(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => ({ id, score }));
  }

  async rebuild() {
    this.#index.clear();
    this.#docStats.clear();
    this.#docCount = 0;
    const ids = await this.#storage.listIds();

    for (const id of ids) {
      const data = await this.#storage.get(id);
      if (data) this.#indexRecord(id, data);
    }

    await this.#save();
  }
}

module.exports = { SearchIndex };
