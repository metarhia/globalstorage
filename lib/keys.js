'use strict';

// Remembers the last parsed key, storage always uses the same key pair
const memoizeLast = (fn) => {
  let lastPem = null;
  let lastKey = null;
  return (pem) => {
    if (pem !== lastPem) {
      lastKey = fn(pem);
      lastPem = pem;
    }
    return lastKey;
  };
};

const loadKeyPair = async (files, generateKeys, basePath) => {
  const publicKey = await files.read(basePath, 'public.pem');
  if (publicKey !== null) {
    const privateKey = await files.read(basePath, 'private.pem');
    if (privateKey === null) throw new Error(`No private key in ${basePath}`);
    return { publicKey, privateKey };
  }
  const keys = await generateKeys();
  await files.write(basePath, 'public.pem', keys.publicKey);
  await files.write(basePath, 'private.pem', keys.privateKey);
  return keys;
};

module.exports = { memoizeLast, loadKeyPair };
