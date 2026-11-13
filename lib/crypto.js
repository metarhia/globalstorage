'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { fsi } = require('./fsi.js');

const calculateHash = (data) => {
  const block = JSON.stringify(data);
  return crypto.createHash('sha256').update(block).digest('hex');
};

const generateKeyPair = promisify(crypto.generateKeyPair);

const generateKeys = () =>
  generateKeyPair('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

const OAEP_HASH = 'sha256';

const encrypt = (data, publicKey) => {
  const buffer = Buffer.from(JSON.stringify(data));
  const key = { key: publicKey, oaepHash: OAEP_HASH };
  return crypto.publicEncrypt(key, buffer).toString('base64url');
};

const decrypt = (data, privateKey) => {
  const buffer = Buffer.from(data, 'base64url');
  const key = { key: privateKey, oaepHash: OAEP_HASH };
  return JSON.parse(crypto.privateDecrypt(key, buffer).toString());
};

const loadKeys = async (basePath) => {
  if (await fsi.exists(basePath, 'public.pem')) {
    const publicKey = await fsi.read(basePath, 'public.pem');
    const privateKey = await fsi.read(basePath, 'private.pem');
    return { publicKey, privateKey };
  }
  const keys = await generateKeys();
  await fsi.write(basePath, 'public.pem', keys.publicKey);
  await fsi.write(basePath, 'private.pem', keys.privateKey);
  return keys;
};

module.exports = { calculateHash, generateKeys, encrypt, decrypt, loadKeys };
