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

  const post = { title: 'Example', content: 'Text', author: 'Timur' };
  const id = await storage.insert(post);

  storage.record(id).on('update', (data, delta) => {
    console.log({ id, data, delta });
  });

  const exists = await storage.has(id);
  if (exists) {
    const data = await storage.get(id);
    data.content += 'example';
    await storage.set(id, data);
    const record = await storage.get(id);
    await storage.delete(id);
    const v2 = await storage.insert(record);
    const delta = { content: 'Changes' };
    await storage.update(v2, delta);
    const prev = delta;
    const changes = { content: '' };
    await storage.swap(v2, changes, prev);
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
