'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const fsi = require('./fsi.js');

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

const encrypt = (data, publicKey) => {
  const buffer = Buffer.from(JSON.stringify(data));
  return crypto.publicEncrypt(publicKey, buffer).toString('base64');
};

const decrypt = (data, privateKey) => {
  const buffer = Buffer.from(data, 'base64');
  const str = crypto.privateDecrypt(privateKey, buffer).toString();
  return JSON.parse(str);
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
