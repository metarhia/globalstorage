'use strict';

const crypto = require('node:crypto');
const fsi = require('./fsi.js');

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
  let publicKey, privateKey;
  if (await fsi.exists(basePath, 'public.pem')) {
    publicKey = await fsi.read(basePath, 'public.pem');
    privateKey = await fsi.read(basePath, 'private.pem');
  } else {
    const keys = await generateKeys();
    await fsi.write(basePath, 'public.pem', keys.publicKey);
    await fsi.write(basePath, 'private.pem', keys.privateKey);
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  }
  return { publicKey, privateKey };
};

module.exports = { generateKeys, encrypt, decrypt, loadKeys };
