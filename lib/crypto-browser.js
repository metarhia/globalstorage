'use strict';

const { fsi } = require('./fsi-browser.js');
const { memoizeLast, loadKeyPair } = require('./keys.js');

const PEM_BOUNDARY = /-----(BEGIN|END) [A-Z ]+-----/g;
const PEM_LINE = /.{1,64}/g;

const ALG = { name: 'RSA-OAEP', hash: 'SHA-256' };

const toHex = (byte) => byte.toString(16).padStart(2, '0');

const calculateHash = async (data) => {
  const block = JSON.stringify(data);
  const input = new TextEncoder().encode(block);
  const digest = await crypto.subtle.digest('SHA-256', input);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes, toHex).join('');
};

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const toBase64UrlSafe = (buffer) => {
  const base64 = toBase64(buffer);
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const toPem = (label, buffer) => {
  const body = toBase64(buffer).match(PEM_LINE) ?? [];
  const header = `-----BEGIN ${label}-----`;
  const footer = `-----END ${label}-----`;
  const lines = [header].concat(body, [footer]);
  return lines.join('\n');
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

const pemToBytes = (pemKey) => {
  const stripped = pemKey.replaceAll(PEM_BOUNDARY, '');
  const base64 = stripped.replaceAll(/\s/g, '');
  return base64ToBytes(base64);
};

const generateKeys = async () => {
  const modulusLength = 2048;
  const publicExponent = new Uint8Array([1, 0, 1]);
  const algorithm = { ...ALG, modulusLength, publicExponent };
  const usages = ['encrypt', 'decrypt'];
  const keyPair = await crypto.subtle.generateKey(algorithm, true, usages);
  const publicExport = crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateExport = crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const exported = await Promise.all([publicExport, privateExport]);
  const publicBytes = exported[0];
  const privateBytes = exported[1];
  const publicKey = toPem('PUBLIC KEY', publicBytes);
  const privateKey = toPem('PRIVATE KEY', privateBytes);
  return { publicKey, privateKey };
};

const importPublicKey = memoizeLast(async (pemKey) => {
  const bytes = pemToBytes(pemKey);
  return crypto.subtle.importKey('spki', bytes, ALG, false, ['encrypt']);
});

const importPrivateKey = memoizeLast(async (pemKey) => {
  const bytes = pemToBytes(pemKey);
  return crypto.subtle.importKey('pkcs8', bytes, ALG, false, ['decrypt']);
});

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

const loadKeys = (basePath = 'keys') =>
  loadKeyPair(fsi, generateKeys, basePath);

module.exports = { calculateHash, generateKeys, encrypt, decrypt, loadKeys };
