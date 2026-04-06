'use strict';

const runCryptoKeysTests = async (
  t,
  assert,
  cryptoMod,
  { getKeysBase } = {},
) => {
  if (typeof getKeysBase !== 'function') {
    throw new TypeError('runCryptoKeysTests requires getKeysBase');
  }

  await t.test('generateKeys function', async () => {
    const keys = await Promise.resolve(cryptoMod.generateKeys());
    assert.strictEqual(typeof keys.publicKey, 'string');
    assert.strictEqual(typeof keys.privateKey, 'string');
    assert.ok(keys.publicKey.includes('-----BEGIN PUBLIC KEY-----'));
    assert.ok(keys.privateKey.includes('-----BEGIN PRIVATE KEY-----'));
  });

  await t.test('encrypt and decrypt functions', async () => {
    const keys = await Promise.resolve(cryptoMod.generateKeys());
    const testData = { message: 'Hello, World!', number: 42 };

    const encrypted = await Promise.resolve(
      cryptoMod.encrypt(testData, keys.publicKey),
    );
    assert.strictEqual(typeof encrypted, 'string');
    assert.notStrictEqual(encrypted, JSON.stringify(testData));

    const decrypted = await Promise.resolve(
      cryptoMod.decrypt(encrypted, keys.privateKey),
    );
    assert.deepStrictEqual(decrypted, testData);
  });

  await t.test('loadKeys function', async (t2) => {
    const base = await getKeysBase(t2);
    const keys1 = await Promise.resolve(cryptoMod.loadKeys(base));
    assert.strictEqual(typeof keys1.publicKey, 'string');
    assert.strictEqual(typeof keys1.privateKey, 'string');

    const keys2 = await Promise.resolve(cryptoMod.loadKeys(base));
    assert.strictEqual(keys2.publicKey, keys1.publicKey);
    assert.strictEqual(keys2.privateKey, keys1.privateKey);
  });
};

module.exports = { runCryptoKeysTests };
