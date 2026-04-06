'use strict';

const runSyncManagerCoreTests = async (t, assert, getSync) => {
  await t.test('addNode listNodes and removeNode', async (t2) => {
    const sync = await getSync(t2);

    await sync.addNode({
      url: 'http://peer.example.com:9000',
      type: 'uplink',
      token: 't1',
    });

    const nodes = sync.listNodes();
    assert.strictEqual(nodes.length, 1);
    assert.strictEqual(nodes[0].url, 'http://peer.example.com:9000');
    assert.strictEqual(nodes[0].type, 'uplink');

    await sync.removeNode('http://peer.example.com:9000');
    assert.strictEqual(sync.listNodes().length, 0);
  });

  await t.test('addNode rejects bad input', async (t2) => {
    const sync = await getSync(t2);

    await assert.rejects(
      () => sync.addNode({ type: 'uplink' }),
      /URL is required/,
    );

    await assert.rejects(
      () =>
        sync.addNode({
          url: 'http://a.com:1',
          type: 'relay',
        }),
      /uplink or downlink/,
    );

    await sync.addNode({
      url: 'http://dup.example.com:80',
      type: 'downlink',
    });

    await assert.rejects(
      () =>
        sync.addNode({
          url: 'http://dup.example.com:80',
          type: 'uplink',
        }),
      /already exists/,
    );
  });

  await t.test('removeNode throws when unknown', async (t2) => {
    const sync = await getSync(t2);
    await assert.rejects(
      () => sync.removeNode('http://nope.example.com:1'),
      /not found/,
    );
  });
};

module.exports = { runSyncManagerCoreTests };
