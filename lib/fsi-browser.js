'use strict';

const dirs = new Map();

const openDir = async (dirPath) => {
  let dir = await navigator.storage.getDirectory();
  for (const part of dirPath.split('/').filter(Boolean)) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir;
};

const resolveDir = (dirPath) => {
  if (!dirs.has(dirPath)) {
    const dir = openDir(dirPath);
    dir.catch(() => dirs.delete(dirPath));
    dirs.set(dirPath, dir);
  }
  return dirs.get(dirPath);
};

const ifMissing = (value) => (error) => {
  if (error.name === 'NotFoundError') return value;
  throw error;
};

const read = async (dir, filename) => {
  const dirHandle = await resolveDir(dir);
  const fileHandle = await dirHandle
    .getFileHandle(filename)
    .catch(ifMissing(null));
  if (!fileHandle) return null;
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
  await dirHandle.removeEntry(filename).catch(ifMissing());
};

const list = async (dir) => {
  const dirHandle = await resolveDir(dir);
  const names = [];
  for await (const name of dirHandle.keys()) names.push(name);
  return names;
};

const fsi = { read, write, exists, remove, list };

module.exports = { fsi };
