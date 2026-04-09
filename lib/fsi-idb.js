'use strict';

/* global indexedDB */

const DB_NAME = 'gs-fsi';
const DB_VERSION = 1;
const NODES = 'nodes';
const IDX_NODE = 'idx_node';
const ROOT_ID = 'root';
const ROOT_NODE = {
  id: ROOT_ID,
  parentId: null,
  name: '/',
  type: 'folder',
  content: null,
};

const once = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

let db = null;

const openDB = async () => {
  if (db) return db;
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(NODES)) {
      const store = db.createObjectStore(NODES, { keyPath: 'id' });
      store.createIndex(IDX_NODE, ['parentId', 'name'], {
        unique: true,
      });
      store.add(ROOT_NODE);
    }
  };
  db = await once(req);
  return db;
};

const resolveDir = async (dirPath, options = {}) => {
  const { create = false, mode = 'readwrite' } = options;
  const connection = await openDB();
  const tx = connection.transaction(NODES, mode);
  const store = tx.objectStore(NODES);
  const index = store.index(IDX_NODE);
  const parts = dirPath.split('/').filter(Boolean);
  let currentId = ROOT_ID;
  for (const part of parts) {
    const nodeId = await once(index.getKey([currentId, part]));
    if (!nodeId && !create) {
      throw new DOMException('Directory not found', 'NotFoundError');
    }
    if (nodeId) {
      currentId = nodeId;
    } else {
      currentId = await once(
        store.add({
          id: crypto.randomUUID(),
          parentId: currentId,
          name: part,
          type: 'folder',
          content: null,
        }),
      );
    }
  }
  return {
    getNode: () => once(store.get(currentId)),
    readFile: (name) => once(index.get([currentId, name])),
    async writeFile(name, content) {
      const existing = await once(index.get([currentId, name]));
      if (existing) {
        existing.content = content;
        return once(store.put(existing));
      }
      return once(
        store.add({
          id: crypto.randomUUID(),
          parentId: currentId,
          name,
          type: 'file',
          content,
        }),
      );
    },
    async removeFile(name) {
      const nodeId = await once(index.getKey([currentId, name]));
      if (nodeId) await once(store.delete(nodeId));
    },
  };
};

const read = async (dir, filename) => {
  const folder = await resolveDir(dir);
  const node = await folder.readFile(filename);
  if (!node) throw new DOMException('File not found', 'NotFoundError');
  return node.content;
};

const write = async (dir, filename, content) => {
  const folder = await resolveDir(dir, { create: true });
  await folder.writeFile(filename, content);
};

const exists = async (dir, filename) => {
  try {
    const folder = await resolveDir(dir);
    const node = await folder.readFile(filename);
    return node !== undefined;
  } catch {
    return false;
  }
};

const remove = async (dir, filename) => {
  try {
    const folder = await resolveDir(dir);
    await folder.removeFile(filename);
  } catch {
    // Directory not found — nothing to remove
  }
};

module.exports = { read, write, exists, remove };
