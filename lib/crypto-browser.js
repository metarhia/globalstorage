'use strict';

const fsi = require('./fsi-browser.js');

const PUBLIC_KEY_HEADER = '-----BEGIN PUBLIC KEY-----';
const PUBLIC_KEY_FOOTER = '-----END PUBLIC KEY-----';
const PRIVATE_KEY_HEADER = '-----BEGIN PRIVATE KEY-----';
const PRIVATE_KEY_FOOTER = '-----END PRIVATE KEY-----';

const ALG = { name: 'RSA-OAEP', hash: 'SHA-256' };

const calculateHash = async (data) => {
  const block = JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(block);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const toBase64UrlSafe = (buffer) => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const base64ToBytes = (base64) => {
  const normalized = base64.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const cleanPemKey = (pemKey, header, footer) => {
  const s = pemKey.replace(header, '').replace(footer, '');
  return s.replaceAll(/\s/g, '');
};

const generateKeys = async () => {
  const keyPair = await crypto.subtle.generateKey(
    { ...ALG, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['encrypt', 'decrypt'],
  );
  const pubBuf = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privBuf = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pub = toBase64UrlSafe(pubBuf);
  const priv = toBase64UrlSafe(privBuf);
  return {
    publicKey: [PUBLIC_KEY_HEADER, pub, PUBLIC_KEY_FOOTER].join('\n'),
    privateKey: [PRIVATE_KEY_HEADER, priv, PRIVATE_KEY_FOOTER].join('\n'),
  };
};

const importPublicKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PUBLIC_KEY_HEADER, PUBLIC_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey('spki', bytes, ALG, false, ['encrypt']);
};

const importPrivateKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey('pkcs8', bytes, ALG, false, ['decrypt']);
};

const encrypt = async (data, publicKey) => {
  const key = await importPublicKey(publicKey);
  const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
  const encryptedBuffer = await crypto.subtle.encrypt(ALG, key, dataBuffer);
  return toBase64UrlSafe(encryptedBuffer);
};

const decrypt = async (data, privateKey) => {
  const key = await importPrivateKey(privateKey);
  const bytes = base64ToBytes(data);
  const buffer = await crypto.subtle.decrypt(ALG, key, bytes);
  return JSON.parse(new TextDecoder().decode(buffer));
};

const loadKeys = async (basePath = 'keys') => {
  let publicKey, privateKey;
  if (await fsi.exists(basePath, 'public.pem')) {
    publicKey = await fsi.read(basePath, 'public.pem');
    privateKey = await fsi.read(basePath, 'private.pem');
  } else {
    const keys = await generateKeys();
    ({ publicKey, privateKey } = keys);
    await fsi.write(basePath, 'public.pem', publicKey);
    await fsi.write(basePath, 'private.pem', privateKey);
  }
  return { publicKey, privateKey };
};

module.exports = { calculateHash, generateKeys, encrypt, decrypt, loadKeys };
