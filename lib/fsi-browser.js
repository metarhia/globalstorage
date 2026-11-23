'use strict';

const dirs = new Map();

const openDir = async (dirPath) => {
  let dir = await navigator.storage.getDirectory();
  const parts = dirPath.split('/').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir;
};

const cacheDir = async (dirPath) => {
  try {
    return await openDir(dirPath);
  } catch (error) {
    dirs.delete(dirPath);
    throw error;
  }
};

const resolveDir = (dirPath) => {
  if (!dirs.has(dirPath)) dirs.set(dirPath, cacheDir(dirPath));
  return dirs.get(dirPath);
};

const ifMissing = (error, value) => {
  if (error.name === 'NotFoundError') return value;
  throw error;
};

const openFile = async (dirHandle, filename) => {
  try {
    return await dirHandle.getFileHandle(filename);
  } catch (error) {
    return ifMissing(error, null);
  }
};

const read = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await openFile(dirHandle, filename);
  if (fileHandle === null) return null;
  const file = await fileHandle.getFile();
  return file.text();
};

const write = async (dir, filename, content) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};

const exists = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  try {
    await dirHandle.getFileHandle(filename);
    return true;
  } catch {
    return false;
  }
};

const remove = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  try {
    await dirHandle.removeEntry(filename);
  } catch (error) {
    ifMissing(error, undefined);
  }
};

const list = async (dir) => {
  const dirHandle = await resolveDir(dir);
  const names = [];
  for await (const name of dirHandle.keys()) names.push(name);
  return names;
};

const fsi = { read, write, exists, remove, list };

module.exports = { fsi };
