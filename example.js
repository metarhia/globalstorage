'use strict';

const globalStorage = require('./gs.js');

const main = async () => {
  const storage = await globalStorage.open();

  await storage.sync
    .addNode({
      type: 'uplink',
      url: 'ws://example.com:8001',
      name: 'Main Server',
      token: 'secret-token-123',
    })
    .then(() => {
      console.log('Added uplink node');
    })
    .catch((error) => {
      console.error('Error adding uplink node:', error.message);
    });

  await storage.sync
    .addNode({
      type: 'downlink',
      url: 'ws://client.example.com:8002',
      name: 'Client Node',
      token: 'secret-token-456',
    })
    .then(() => {
      console.log('Added downlink node');
    })
    .catch((error) => {
      console.error('Error adding downlink node:', error.message);
    });

  const nodes = storage.sync.listNodes();
  console.log('List nodes', nodes);

  // Domain logic

  const authorData = { name: 'Timur', email: 'timur@example.com' };
  const authorId = await storage.insert(authorData);

  const post = { title: 'Example', content: 'Text', author: authorId };
  const id = await storage.insert(post);

  // Implicit API - Record with dynamic getters/setters

  const postRecord = await storage.record(id);

  postRecord.on('update', (data, delta) => {
    console.log('Record updated:', { id, data, delta });
  });

  console.log('Title:', postRecord.title);
  console.log('Content:', postRecord.content);
  console.log('Author:', postRecord.author);

  postRecord.content += 'example';
  postRecord.title = 'Updated Example';

  const delta = postRecord.delta();
  console.log('Delta before save:', delta);

  await postRecord.save();

  const authorRecord = await postRecord.author.record();
  console.log('Author name:', authorRecord.name);

  // Delete record
  // await postRecord.delete();

  // Explicit API (still available)

  const exists = await storage.has(id);
  if (exists) {
    const data = await storage.get(id);
    data.content += ' more changes';
    await storage.set(id, data);
  }

  await storage.sync.start();
  console.log('Synced');

  const valid = await storage.validate({ last: 10 });
  console.log('Storage valid after adding:', valid);

  await storage.sync.removeNode('ws://client.example.com:8002');
  console.log('Removed downlink node');
  console.log('Remaining nodes:', storage.sync.listNodes());
};

main();
