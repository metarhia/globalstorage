'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const gs = require('..');
const {
  normalize,
  extractTrigrams,
  extractStrings,
  extractRecordTrigrams,
} = require('../lib/fts/trigrams.js');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('normalize', async (t) => {
  await t.test('lowercases text', () => {
    assert.strictEqual(normalize('HeLLo'), 'hello');
  });

  await t.test('collapses whitespace', () => {
    assert.strictEqual(normalize('hi   there'), 'hi there');
  });

  await t.test('trims leading and trailing whitespace', () => {
    assert.strictEqual(normalize('  hi  '), 'hi');
  });

  await t.test('strips diacritics (NFD combining marks)', () => {
    assert.strictEqual(normalize('café'), 'cafe');
    assert.strictEqual(normalize('naïve'), 'naive');
    assert.strictEqual(normalize('résumé'), 'resume');
  });

  await t.test('handles combined normalization', () => {
    assert.strictEqual(normalize('  Café  LATTE  '), 'cafe latte');
  });

  await t.test('returns empty string for whitespace-only input', () => {
    assert.strictEqual(normalize('   '), '');
  });
});

test('extractTrigrams', async (t) => {
  await t.test('extracts trigrams from a normal string', () => {
    const trigrams = [...extractTrigrams('hello')];
    assert.deepStrictEqual(trigrams, ['hel', 'ell', 'llo']);
  });

  await t.test('returns no trigrams for strings shorter than 3 chars', () => {
    assert.deepStrictEqual([...extractTrigrams('hi')], []);
    assert.deepStrictEqual([...extractTrigrams('a')], []);
  });

  await t.test('returns no trigrams for empty string', () => {
    assert.deepStrictEqual([...extractTrigrams('')], []);
  });

  await t.test('preserves spaces as word boundaries', () => {
    const trigrams = [...extractTrigrams('hi bob')];
    assert.deepStrictEqual(trigrams, ['hi ', 'i b', ' bo', 'bob']);
  });

  await t.test('normalizes before extracting', () => {
    const trigrams = [...extractTrigrams('HeLLo')];
    assert.deepStrictEqual(trigrams, ['hel', 'ell', 'llo']);
  });

  await t.test('strips diacritics before extracting', () => {
    const trigrams = [...extractTrigrams('café')];
    assert.deepStrictEqual(trigrams, ['caf', 'afe']);
  });

  await t.test('yields duplicate trigrams for repeated patterns', () => {
    // "abcabc" → abc, bca, cab, abc  (abc appears twice)
    const trigrams = [...extractTrigrams('abcabc')];
    assert.deepStrictEqual(trigrams, ['abc', 'bca', 'cab', 'abc']);
  });

  await t.test('exactly 3 chars yields one trigram', () => {
    const trigrams = [...extractTrigrams('abc')];
    assert.deepStrictEqual(trigrams, ['abc']);
  });
});

test('extractStrings', async (t) => {
  await t.test('extracts strings from a flat object', () => {
    const strings = [...extractStrings({ a: 'hello', b: 'world' })];
    assert.deepStrictEqual(strings, ['hello', 'world']);
  });

  await t.test('extracts strings from nested objects', () => {
    const strings = [...extractStrings({ a: { b: { c: 'deep' } } })];
    assert.deepStrictEqual(strings, ['deep']);
  });

  await t.test('extracts strings from arrays', () => {
    const strings = [...extractStrings({ tags: ['alpha', 'beta'] })];
    assert.deepStrictEqual(strings, ['alpha', 'beta']);
  });

  await t.test('skips non-string values', () => {
    const data = { n: 42, b: true, x: null, s: 'keep' };
    const strings = [...extractStrings(data)];
    assert.deepStrictEqual(strings, ['keep']);
  });

  await t.test('handles mixed nested structures', () => {
    const data = {
      title: 'Post',
      meta: { author: 'Alice', tags: ['js', 'node'] },
      count: 5,
    };
    const strings = [...extractStrings(data)];
    assert.deepStrictEqual(strings, ['Post', 'Alice', 'js', 'node']);
  });

  await t.test('yields nothing for non-object non-string input', () => {
    assert.deepStrictEqual([...extractStrings(42)], []);
    assert.deepStrictEqual([...extractStrings(null)], []);
    assert.deepStrictEqual([...extractStrings(true)], []);
  });

  await t.test('yields the string itself for a bare string input', () => {
    assert.deepStrictEqual([...extractStrings('bare')], ['bare']);
  });
});

test('extractRecordTrigrams', async (t) => {
  await t.test('returns a Map of trigram counts', () => {
    const counts = extractRecordTrigrams({ name: 'hello' });
    assert.ok(counts instanceof Map);
    assert.strictEqual(counts.get('hel'), 1);
    assert.strictEqual(counts.get('ell'), 1);
    assert.strictEqual(counts.get('llo'), 1);
  });

  await t.test('sums trigram counts across multiple fields', () => {
    const counts = extractRecordTrigrams({ a: 'hello', b: 'hello' });
    assert.strictEqual(counts.get('hel'), 2);
    assert.strictEqual(counts.get('ell'), 2);
    assert.strictEqual(counts.get('llo'), 2);
  });

  await t.test('returns empty map for record with no string fields', () => {
    const counts = extractRecordTrigrams({ x: 42, y: true });
    assert.strictEqual(counts.size, 0);
  });

  await t.test('returns empty map for short strings only', () => {
    const counts = extractRecordTrigrams({ a: 'hi', b: 'ok' });
    assert.strictEqual(counts.size, 0);
  });

  await t.test('handles nested records', () => {
    const counts = extractRecordTrigrams({
      user: { name: 'alice', bio: 'coder' },
    });
    assert.ok(counts.has('ali'));
    assert.ok(counts.has('cod'));
  });
});

// --- Level 2: Integration tests for SearchIndex + Storage ---

test('SearchIndex via Storage', async (t) => {
  await t.test('basic search returns matching records', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      const id1 = await storage.insert({ title: 'JavaScript fundamentals' });
      const id2 = await storage.insert({ title: 'Python basics' });

      const results = storage.search('javascript');
      const ids = results.map((r) => r.id);
      assert.ok(ids.includes(id1));
      assert.ok(!ids.includes(id2));
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('substring search works via trigrams', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      const id = await storage.insert({ title: 'development' });

      const results = storage.search('develop');
      assert.ok(results.length > 0);
      assert.strictEqual(results[0].id, id);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('TF-IDF ranks more relevant documents higher', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      // Add unrelated documents so IDF for "javascript" trigrams is non-zero
      await storage.insert({ content: 'cooking recipes and food' });
      await storage.insert({ content: 'music theory and harmony' });
      const id1 = await storage.insert({
        content: 'javascript is great',
      });
      const id2 = await storage.insert({
        content: 'javascript javascript javascript rocks',
      });

      const results = storage.search('javascript');
      assert.ok(results.length >= 2);
      const rank1 = results.findIndex((r) => r.id === id1);
      const rank2 = results.findIndex((r) => r.id === id2);
      assert.ok(
        rank2 < rank1,
        'record with more occurrences should rank higher',
      );
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('update re-indexes the record', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      const id = await storage.insert({ title: 'hello world' });

      assert.ok(storage.search('hello').length > 0);

      await storage.update(id, { title: 'goodbye world' });

      assert.strictEqual(storage.search('hello').length, 0);
      assert.ok(storage.search('goodbye').length > 0);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('delete removes record from index', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      const id = await storage.insert({ title: 'ephemeral data' });

      assert.ok(storage.search('ephemeral').length > 0);

      await storage.delete(id);

      assert.strictEqual(storage.search('ephemeral').length, 0);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('persistence: index survives Storage restart', async () => {
    const tempDir = await createTempDir();
    try {
      const storage1 = await new gs.Storage({ path: tempDir });
      await storage1.insert({ title: 'persistent record' });

      const results1 = storage1.search('persistent');
      assert.ok(results1.length > 0);

      // Create a new Storage instance pointing to the same directory
      const storage2 = await new gs.Storage({ path: tempDir });
      const results2 = storage2.search('persistent');
      assert.ok(results2.length > 0);
      assert.strictEqual(results2[0].id, results1[0].id);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('encrypted records are not indexed', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      await storage.saveData('secret-1', { title: 'top secret' }, {
        encrypted: true,
      });

      const results = storage.search('secret');
      assert.strictEqual(results.length, 0);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('rebuild reconstructs the index from data files', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      await storage.insert({ title: 'rebuild test record' });

      // Delete the index file manually
      const indexPath = path.join(tempDir, 'fts', 'fts-index.json');
      await fs.unlink(indexPath);

      // Verify search returns nothing after index is gone
      const storage2 = await new gs.Storage({ path: tempDir });
      assert.strictEqual(storage2.search('rebuild').length, 0);

      // Rebuild and verify
      await storage2.fts.rebuild();
      const results = storage2.search('rebuild');
      assert.ok(results.length > 0);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('search with short query returns empty results', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      await storage.insert({ title: 'something' });

      const results = storage.search('ab');
      assert.strictEqual(results.length, 0);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('search respects limit parameter', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });
      for (let i = 0; i < 5; i++) {
        await storage.insert({ title: `document number ${i}` });
      }

      const results = storage.search('document', 2);
      assert.strictEqual(results.length, 2);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
