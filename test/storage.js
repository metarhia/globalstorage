'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const { directoryExists } = require('metautil');
const globalStorage = require('..');
const { useTemp } = require('./utils/temp.js');

const mockSchema = {
  entities: {
    Post: { title: 'string', content: 'string', author: 'Author' },
    Author: { name: 'string', email: 'string' },
    Comment: { text: 'string', post: 'Post', author: 'Author' },
  },
};

test('Storage module', async (t) => {
  await t.test('Storage constructor and initialization', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });

    assert.ok(storage instanceof globalStorage.Storage);
    assert.strictEqual(await directoryExists(tempDir), true);
  });

  await t.test(
    'Storage saveData and loadData without encryption',
    async (t) => {
      const tempDir = await useTemp(t);
      const storage = await globalStorage.open({ path: tempDir });

      const testData = { message: 'Hello, Storage!', number: 123 };
      await storage.saveData('test-1', testData);

      const loadedData = await storage.loadData('test-1');
      assert.deepStrictEqual(loadedData, testData);
    },
  );

  await t.test('Storage saveData and loadData with encryption', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });

    const testData = { secret: 'encrypted data', value: 456 };
    await storage.saveData('test-2', testData, { encrypted: true });

    const loadedData = await storage.loadData('test-2');
    assert.deepStrictEqual(loadedData, testData);
  });

  await t.test('Storage loadData with non-existent data', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });

    const result = await storage.loadData('nonexistent');
    assert.strictEqual(result, null);
  });

  await t.test('Storage validate method', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });

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

    const chainOk = await storage.validate({ last: 2 });
    assert.strictEqual(chainOk, true);
  });

  await t.test('Storage loadData throws if tampered', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });
    await storage.saveData('tampered', { ok: true });

    const filePath = path.join(tempDir, 'data', 'tampered.json');
    const entry = JSON.parse(await fs.readFile(filePath, 'utf8'));
    entry.data = { ok: false };
    await fs.writeFile(filePath, JSON.stringify(entry), 'utf8');

    const storage2 = await globalStorage.open({ path: tempDir });
    await assert.rejects(() => storage2.loadData('tampered'), /invalid/);
  });

  await t.test('Storage insert set swap and update errors', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });

    const id = await storage.insert({ n: 1 });
    assert.strictEqual(typeof id, 'string');
    assert.deepStrictEqual(await storage.get(id), { n: 1 });

    await storage.set(id, { n: 2, v: 0 });
    assert.deepStrictEqual(await storage.get(id), { n: 2, v: 0 });

    const swapped = await storage.swap(id, { v: 1 }, { n: 2 });
    assert.strictEqual(swapped, true);
    assert.deepStrictEqual(await storage.get(id), { n: 2, v: 1 });

    const notSwapped = await storage.swap(id, { v: 9 }, { n: 999 });
    assert.strictEqual(notSwapped, false);

    await assert.rejects(
      () => storage.update('missing-id', { x: 1 }),
      /not found/,
    );
  });

  await t.test('Storage with schema creates collections', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    assert.strictEqual(storage.schema, mockSchema);
    assert.ok(storage.Post instanceof globalStorage.Storage.Collection);
    assert.ok(storage.Author instanceof globalStorage.Storage.Collection);
    assert.ok(storage.Comment instanceof globalStorage.Storage.Collection);
    assert.strictEqual(storage.Post.name, 'Post');
    assert.strictEqual(storage.Author.name, 'Author');
  });

  await t.test('Storage with Map-based schema entities', async (t) => {
    const tempDir = await useTemp(t);
    const mapSchema = {
      entities: new Map([
        ['User', { name: 'string', email: 'string' }],
        ['Article', { title: 'string', body: 'string' }],
      ]),
    };
    const options = { path: tempDir, schema: mapSchema };
    const storage = await globalStorage.open(options);

    assert.ok(storage.User instanceof globalStorage.Storage.Collection);
    assert.ok(storage.Article instanceof globalStorage.Storage.Collection);
    assert.strictEqual(storage.User.name, 'User');
    assert.strictEqual(storage.Article.name, 'Article');

    const userData = { name: 'Test', email: 'a@b.com' };
    const user = await storage.User.insert(userData);
    assert.ok(user.id);
    assert.strictEqual(user.name, 'Test');
  });

  await t.test('Storage without schema has no collections', async (t) => {
    const tempDir = await useTemp(t);
    const storage = await globalStorage.open({ path: tempDir });

    assert.strictEqual(storage.schema, null);
    assert.strictEqual(storage.Post, undefined);
    assert.strictEqual(storage.Author, undefined);
  });
});

test('Collection module', async (t) => {
  await t.test('Collection insert returns a Record', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const authorData = { name: 'John', email: 'john@example.com' };
    const authorRecord = await storage.Author.insert(authorData);

    assert.ok(authorRecord instanceof globalStorage.Storage.Record);
    assert.ok(authorRecord.id);
    assert.strictEqual(authorRecord.name, 'John');
    assert.strictEqual(authorRecord.email, 'john@example.com');
  });

  await t.test('Collection insert adds $type to data', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const postData = { title: 'Hello', content: 'World' };
    const postRecord = await storage.Post.insert(postData);

    const rawData = await storage.get(postRecord.id);
    assert.strictEqual(rawData.$type, 'Post');
    assert.strictEqual(rawData.title, 'Hello');
    assert.strictEqual(rawData.content, 'World');
  });

  await t.test('Collection get retrieves data', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const authorRecord = await storage.Author.insert({
      name: 'Jane',
      email: 'jane@example.com',
    });

    const data = await storage.Author.get(authorRecord.id);
    assert.strictEqual(data.name, 'Jane');
    assert.strictEqual(data.email, 'jane@example.com');
    assert.strictEqual(data.$type, 'Author');
  });

  await t.test('Collection update modifies data', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const postRecord = await storage.Post.insert({
      title: 'Original',
      content: 'Content',
    });

    await storage.Post.update(postRecord.id, { title: 'Updated' });

    const data = await storage.Post.get(postRecord.id);
    assert.strictEqual(data.title, 'Updated');
    assert.strictEqual(data.content, 'Content');
  });

  await t.test('Collection delete removes data', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const commentRecord = await storage.Comment.insert({
      text: 'Nice post!',
    });
    const id = commentRecord.id;

    const existsBefore = await storage.has(id);
    assert.strictEqual(existsBefore, true);

    await storage.Comment.delete(id);

    const existsAfter = await storage.has(id);
    assert.strictEqual(existsAfter, false);
  });

  await t.test('Collection record returns a Record instance', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const authorRecord = await storage.Author.insert({
      name: 'Bob',
      email: 'bob@example.com',
    });
    const id = authorRecord.id;

    const record = await storage.Author.record(id);
    assert.ok(record instanceof globalStorage.Storage.Record);
    assert.strictEqual(record.id, id);
    assert.strictEqual(record.name, 'Bob');
  });

  await t.test('Multiple collections work independently', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

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
  });

  await t.test('Record save persists mutations', async (t) => {
    const tempDir = await useTemp(t);
    const options = { path: tempDir, schema: mockSchema };
    const storage = await globalStorage.open(options);

    const post = await storage.Post.insert({
      title: 'Draft',
      content: 'Body',
    });
    post.title = 'Published';
    await post.save();

    const loaded = await storage.Post.get(post.id);
    assert.strictEqual(loaded.title, 'Published');
  });
});
