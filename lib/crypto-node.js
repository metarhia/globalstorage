'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { fsi } = require('./fsi-node.js');
const { memoizeLast, loadKeyPair } = require('./keys.js');

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
const publicKeyOf = memoizeLast((pem) => crypto.createPublicKey(pem));
const privateKeyOf = memoizeLast((pem) => crypto.createPrivateKey(pem));

const encrypt = (data, publicKey) => {
  const buffer = Buffer.from(JSON.stringify(data));
  const key = { key: publicKeyOf(publicKey), oaepHash: OAEP_HASH };
  return crypto.publicEncrypt(key, buffer).toString('base64url');
};

const decrypt = (data, privateKey) => {
  const buffer = Buffer.from(data, 'base64url');
  const key = { key: privateKeyOf(privateKey), oaepHash: OAEP_HASH };
  return JSON.parse(crypto.privateDecrypt(key, buffer).toString());
};

const loadKeys = (basePath) => loadKeyPair(fsi, generateKeys, basePath);

module.exports = { calculateHash, generateKeys, encrypt, decrypt, loadKeys };
