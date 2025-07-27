'use strict';

const test = require('node:test');
const assert = require('node:assert');
const gs = require('..');
const { createTempDir, cleanupTempDir } = require('./test-utils.js');

test('Integration tests', async (t) => {
  await t.test(
    'Full workflow: keys -> storage -> contract -> chain',
    async () => {
      const tempDir = await createTempDir();
      try {
        const keys = await gs.loadKeys(tempDir);
        const blockchain = await new gs.Blockchain(tempDir);
        const storage = await new gs.Storage(tempDir, blockchain, keys);

        const contractProc = async (reader, args) => {
          const data = await reader.get(args.id);
          const existingData = data || { count: 0 };
          return {
            ...existingData,
            count: existingData.count + 1,
            lastUpdate: Date.now(),
          };
        };

        const contract = new gs.SmartContract(
          'counter-contract',
          contractProc,
          { storage, chain: blockchain },
        );

        const result1 = await contract.execute({ id: 'counter-1' });
        assert.strictEqual(result1.count, 1);

        const result2 = await contract.execute({ id: 'counter-1' });
        assert.strictEqual(result2.count, 2);

        const loadedData = await storage.loadData('counter-1');
        assert.strictEqual(loadedData.count, 2);

        const isValid = await blockchain.isValid();
        assert.strictEqual(isValid, true);
      } finally {
        await cleanupTempDir(tempDir);
      }
    },
  );
});
