const PUBLIC_KEY_HEADER = '-----BEGIN PUBLIC KEY-----';
const PUBLIC_KEY_FOOTER = '-----END PUBLIC KEY-----';
const PRIVATE_KEY_HEADER = '-----BEGIN PRIVATE KEY-----';
const PRIVATE_KEY_FOOTER = '-----END PRIVATE KEY-----';

const toBase64UrlSafe = (buffer) => {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const cleanPemKey = (pemKey, header, footer) => {
  const s = pemKey.replace(header, '').replace(footer, '');
  return s.replaceAll(' ', '');
};

const calculateHash = async (data) => {
  const block = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(block);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const toHex = (b) => b.toString(16).padStart(2, '0');
  const hashHex = hashArray.map(toHex).join('');
  return hashHex;
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

  return await crypto.subtle.importKey(
    'spki',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt'],
  );
};

const importPrivateKey = async (pemKey) => {
  const base64 = cleanPemKey(pemKey, PRIVATE_KEY_HEADER, PRIVATE_KEY_FOOTER);
  const bytes = base64ToBytes(base64);

  return await crypto.subtle.importKey(
    'pkcs8',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt'],
  );
};

const encrypt = async (data, publicKey) => {
  const key = await importPublicKey(publicKey);
  const dataString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(dataString);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    key,
    dataBuffer,
  );

  return toBase64UrlSafe(encryptedBuffer);
};

const decrypt = async (data, privateKey) => {
  const key = await importPrivateKey(privateKey);
  const bytes = base64ToBytes(data);
  const name = 'RSA-OAEP';
  const buffer = await crypto.subtle.decrypt({ name }, key, bytes);
  const decoder = new TextDecoder();
  const decrypted = decoder.decode(buffer);
  return JSON.parse(decrypted);
};

const deserializeFunction = (source) => {
  const arrowIndex = source.indexOf('=>');
  const header = source.slice(0, arrowIndex).trim();
  let body = source.slice(arrowIndex + 2).trim();
  const argsStart = header.indexOf('(');
  const argsEnd = header.lastIndexOf(')');
  const args = header.slice(argsStart + 1, argsEnd);
  if (body.startsWith('{')) body = body.slice(1, -1);
  else body = `return ${body};`;
  body = `return async (${args}) => {${body}}`;
  return new Function('reader', 'args', body)();
};

const loadKeys = async (basePath = 'keys') => {
  let publicKey, privateKey;
  try {
    const root = await navigator.storage.getDirectory();
    const keysDir = await root.getDirectoryHandle(basePath, { create: true });

    try {
      const publicFile = await keysDir.getFileHandle('public.pem');
      const privateFile = await keysDir.getFileHandle('private.pem');

      const publicKeyFile = await publicFile.getFile();
      const privateKeyFile = await privateFile.getFile();

      publicKey = await publicKeyFile.text();
      privateKey = await privateKeyFile.text();
    } catch {
      const keys = await generateKeys();

      const publicFileHandle = await keysDir.getFileHandle('public.pem', {
        create: true,
      });
      const privateFileHandle = await keysDir.getFileHandle('private.pem', {
        create: true,
      });

      const publicWritable = await publicFileHandle.createWritable();
      const privateWritable = await privateFileHandle.createWritable();

      await publicWritable.write(keys.publicKey);
      await privateWritable.write(keys.privateKey);

      await publicWritable.close();
      await privateWritable.close();

      publicKey = keys.publicKey;
      privateKey = keys.privateKey;
    }
  } catch {
    const keys = await generateKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  }

  return { publicKey, privateKey };
};

export {
  generateKeys,
  encrypt,
  decrypt,
  loadKeys,
  calculateHash,
  deserializeFunction,
};
