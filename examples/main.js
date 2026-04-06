'use strict';

const globalStorage = require('../globalstorage.js');
const domain = require('./domain.js');

const main = async () => {
  const storage = await globalStorage.open();
  domain.init(storage);

  const authorId = await storage.insert({
    name: 'Example Author',
    email: 'author@example.com',
  });
  const feedId = await storage.insert({ title: 'Example feed' });

  const title = 'Example';
  const content = 'Text';
  const { postId } = await domain.create({
    author: authorId,
    title,
    content,
    feed: feedId,
  });
  console.log('Post created:', postId);

  await domain.publish({ postId });
  console.log('Post published');
};

main();
