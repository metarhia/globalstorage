'use strict';

const fsi = require('./fsi-browser.js');

const PUBLIC_KEY_HEADER = '-----BEGIN PUBLIC KEY-----';
const PUBLIC_KEY_FOOTER = '-----END PUBLIC KEY-----';
const PRIVATE_KEY_HEADER = '-----BEGIN PRIVATE KEY-----';
const PRIVATE_KEY_FOOTER = '-----END PRIVATE KEY-----';

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
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  );

  const publicKeyBuffer = await crypto.subtle.exportKey(
    'spki',
    keyPair.publicKey,
  );
  const privateKeyBuffer = await crypto.subtle.exportKey(
    'pkcs8',
    keyPair.privateKey,
  );

  const publicKey = toBase64UrlSafe(publicKeyBuffer);
  const privateKey = toBase64UrlSafe(privateKeyBuffer);

  return {
    publicKey: `${PUBLIC_KEY_HEADER}\n${publicKey}\n${PUBLIC_KEY_FOOTER}`,
    privateKey: `${PRIVATE_KEY_HEADER}\n${privateKey}\n${PRIVATE_KEY_FOOTER}`,
  };
};

const importPublicKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PUBLIC_KEY_HEADER, PUBLIC_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey(
    'spki',
    bytes,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
};

const importPrivateKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER);
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt'],
  );
};

const encrypt = async (data, publicKey) => {
  const key = await importPublicKey(publicKey);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    dataBuffer,
  );
  return toBase64UrlSafe(encryptedBuffer);
};

const decrypt = async (data, privateKey) => {
  const key = await importPrivateKey(privateKey);
  const bytes = base64ToBytes(data);
  const buffer = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, bytes);
  return JSON.parse(new TextDecoder().decode(buffer));
};

const loadKeys = async (basePath = 'keys') => {
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
