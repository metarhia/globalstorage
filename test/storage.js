'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const { directoryExists } = require('metautil');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

const mockSchema = {
  entities: {
    Post: { title: 'string', content: 'string', author: 'Author' },
    Author: { name: 'string', email: 'string' },
    Comment: { text: 'string', post: 'Post', author: 'Author' },
  },
};

test('Storage module', async (t) => {
  await t.test('Storage constructor and initialization', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });

      assert.ok(storage instanceof gs.Storage);
      assert.strictEqual(await directoryExists(tempDir), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage saveData and loadData without encryption', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });

      const testData = { message: 'Hello, Storage!', number: 123 };
      await storage.saveData('test-1', testData);

      const loadedData = await storage.loadData('test-1');
      assert.deepStrictEqual(loadedData, testData);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage saveData and loadData with encryption', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });

      const testData = { secret: 'encrypted data', value: 456 };
      await storage.saveData('test-2', testData, { encrypted: true });

      const loadedData = await storage.loadData('test-2');
      assert.deepStrictEqual(loadedData, testData);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage loadData with non-existent data', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });

      const result = await storage.loadData('nonexistent');
      assert.strictEqual(result, null);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage validate method', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });

      const testData = { message: 'Test validation' };
      await storage.saveData('test-3', testData);

      const filePath = path.join(tempDir, 'data', 'test-3.json');
      const raw = await fs.readFile(filePath, { encoding: 'utf8' });
      const entry = JSON.parse(raw);

      const isValid = await storage.validate('test-3', entry.data, entry.block);
      assert.strictEqual(isValid, true);

      const isInvalid = await storage.validate(
        'test-3',
        { modified: 'data' },
        entry.block,
      );
      assert.strictEqual(isInvalid, false);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage with schema creates collections', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      assert.strictEqual(storage.schema, mockSchema);
      assert.ok(storage.Post instanceof gs.Collection);
      assert.ok(storage.Author instanceof gs.Collection);
      assert.ok(storage.Comment instanceof gs.Collection);
      assert.strictEqual(storage.Post.name, 'Post');
      assert.strictEqual(storage.Author.name, 'Author');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage with Map-based schema entities', async () => {
    const tempDir = await createTempDir();
    try {
      const mapSchema = {
        entities: new Map([
          ['User', { name: 'string', email: 'string' }],
          ['Article', { title: 'string', body: 'string' }],
        ]),
      };
      const options = { path: tempDir, schema: mapSchema };
      const storage = await new gs.Storage(options);

      assert.ok(storage.User instanceof gs.Collection);
      assert.ok(storage.Article instanceof gs.Collection);
      assert.strictEqual(storage.User.name, 'User');
      assert.strictEqual(storage.Article.name, 'Article');

      const userData = { name: 'Test', email: 'a@b.com' };
      const user = await storage.User.insert(userData);
      assert.ok(user.id);
      assert.strictEqual(user.name, 'Test');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Storage without schema has no collections', async () => {
    const tempDir = await createTempDir();
    try {
      const storage = await new gs.Storage({ path: tempDir });

      assert.strictEqual(storage.schema, null);
      assert.strictEqual(storage.Post, undefined);
      assert.strictEqual(storage.Author, undefined);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});

test('Collection module', async (t) => {
  await t.test('Collection insert returns a Record', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const authorData = { name: 'John', email: 'john@example.com' };
      const authorRecord = await storage.Author.insert(authorData);

      assert.ok(authorRecord instanceof gs.Record);
      assert.ok(authorRecord.id);
      assert.strictEqual(authorRecord.name, 'John');
      assert.strictEqual(authorRecord.email, 'john@example.com');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Collection insert adds $type to data', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const postData = { title: 'Hello', content: 'World' };
      const postRecord = await storage.Post.insert(postData);

      const rawData = await storage.get(postRecord.id);
      assert.strictEqual(rawData.$type, 'Post');
      assert.strictEqual(rawData.title, 'Hello');
      assert.strictEqual(rawData.content, 'World');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Collection get retrieves data', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const authorRecord = await storage.Author.insert({
        name: 'Jane',
        email: 'jane@example.com',
      });

      const data = await storage.Author.get(authorRecord.id);
      assert.strictEqual(data.name, 'Jane');
      assert.strictEqual(data.email, 'jane@example.com');
      assert.strictEqual(data.$type, 'Author');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Collection update modifies data', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const postRecord = await storage.Post.insert({
        title: 'Original',
        content: 'Content',
      });

      await storage.Post.update(postRecord.id, { title: 'Updated' });

      const data = await storage.Post.get(postRecord.id);
      assert.strictEqual(data.title, 'Updated');
      assert.strictEqual(data.content, 'Content');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Collection delete removes data', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const commentRecord = await storage.Comment.insert({
        text: 'Nice post!',
      });
      const id = commentRecord.id;

      const existsBefore = await storage.has(id);
      assert.strictEqual(existsBefore, true);

      await storage.Comment.delete(id);

      const existsAfter = await storage.has(id);
      assert.strictEqual(existsAfter, false);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Collection record returns a Record instance', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const authorRecord = await storage.Author.insert({
        name: 'Bob',
        email: 'bob@example.com',
      });
      const id = authorRecord.id;

      const record = await storage.Author.record(id);
      assert.ok(record instanceof gs.Record);
      assert.strictEqual(record.id, id);
      assert.strictEqual(record.name, 'Bob');
    } finally {
      await cleanupTempDir(tempDir);
    }
  });

  await t.test('Multiple collections work independently', async () => {
    const tempDir = await createTempDir();
    try {
      const options = { path: tempDir, schema: mockSchema };
      const storage = await new gs.Storage(options);

      const author = await storage.Author.insert({
        name: 'Alice',
        email: 'alice@example.com',
      });

      const post = await storage.Post.insert({
        title: 'My Post',
        content: 'Post content',
        author: author.id,
      });

      const comment = await storage.Comment.insert({
        text: 'Great post!',
        post: post.id,
        author: author.id,
      });

      const authorData = await storage.Author.get(author.id);
      const postData = await storage.Post.get(post.id);
      const commentData = await storage.Comment.get(comment.id);

      assert.strictEqual(authorData.$type, 'Author');
      assert.strictEqual(postData.$type, 'Post');
      assert.strictEqual(commentData.$type, 'Comment');
      assert.strictEqual(postData.author, author.id);
      assert.strictEqual(commentData.post, post.id);
    } finally {
      await cleanupTempDir(tempDir);
    }
  });
});
