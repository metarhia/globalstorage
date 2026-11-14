'use strict';

const globalStorage = require('./globalstorage.js');
const xxii = require('xxii-schema');

const main = async () => {
  const xxiiSchema = await xxii.load();
  console.log(xxiiSchema);
  const storage = await globalStorage.open({ schema: xxiiSchema });

  // Implicit API - Record with dynamic getters/setters

  const authorData = { name: 'Timur', email: 'timur@example.com' };
  const authorId = await storage.insert(authorData);
  const authorRecord = await storage.record(authorId);
  authorRecord.email = 'timur.shemsedinov@gmail.com';
  await authorRecord.save();

  const post = { title: 'Example', content: 'Text', author: authorId };
  const postRecord = await storage.Post.insert(post);

  postRecord.on('update', ({ data, delta }) => {
    console.log('Record updated:', { id: postRecord.id, data, delta });
  });

  console.log('Title:', postRecord.title);
  console.log('Content:', postRecord.content);
  console.log('Author:', postRecord.author);

  postRecord.content += 'example';
  postRecord.title = 'Updated Example';

  const delta = postRecord.delta();
  console.log('Delta before save:', delta);

  await postRecord.save();

  const postAuthor = await postRecord.author.record();
  console.log('Author name:', postAuthor.name);

  // Explicit API (still available)

  const exists = await storage.has(postRecord.id);
  if (exists) {
    const data = await storage.get(postRecord.id);
    data.content += ' more changes';
    await storage.set(postRecord.id, data);
  }

  const valid = await storage.validate({ last: 10 });
  console.log('Storage valid after adding:', valid);
};

main();
