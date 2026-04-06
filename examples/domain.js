'use strict';

// Domain logic: message

let storage = null;

const init = (storageProvider) => {
  storage = storageProvider;
};

const create = async ({ author, title, content, feed }) => {
  const authorExists = await storage.has(author);
  if (!authorExists) throw new Error('Author not found');

  const feedExists = await storage.has(feed);
  if (!feedExists) throw new Error('Feed not found');

  const created = new Date().getTime();
  const status = 'draft';
  const post = { title, content, author, created, status };
  const postId = await storage.insert(post);

  return { postId };
};

const publish = async ({ postId }) => {
  const existing = await storage.get(postId);
  if (!existing) throw new Error('Post not found');
  await storage.update(postId, { status: 'published' });
};

module.exports = { init, create, publish };
