'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { ensureDirectory } = require('metautil');

const generateKeys = () => {
  const promise = new Promise((resolve, reject) => {
    const format = 'pem';
    const options = {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format },
      privateKeyEncoding: { type: 'pkcs8', format },
    };
    const callback = (error, publicKey, privateKey) => {
      if (error) return void reject(error);
      resolve({ publicKey, privateKey });
    };
    crypto.generateKeyPair('rsa', options, callback);
  });
  return promise;
};

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
  const publicKeyPath = path.join(basePath, 'public.pem');
  const privateKeyPath = path.join(basePath, 'private.pem');
  await ensureDirectory(basePath);
  let publicKey, privateKey;
  try {
    publicKey = await fs.readFile(publicKeyPath, 'utf8');
    privateKey = await fs.readFile(privateKeyPath, 'utf8');
  } catch {
    const keys = await generateKeys();
    await fs.writeFile(publicKeyPath, keys.publicKey);
    await fs.writeFile(privateKeyPath, keys.privateKey);
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  }
  return { publicKey, privateKey };
};

module.exports = { generateKeys, encrypt, decrypt, loadKeys };
