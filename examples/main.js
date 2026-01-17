'use strict';

const globalStorage = require('../gs.js');
const domain = require('./domain.js');

const main = async () => {
  // App start and init
  const storage = await globalStorage.open();
  domain.init(storage);

  // Create post
  const title = 'Example';
  const content = 'Text';
  const post = { author: '123', title, content, feed: '123' };
  const postId = await domain.create(post);
  console.log('Post created:', postId);

  // Publish post
  await domain.publish({ postId });
  console.log('Post published');
};

main();
