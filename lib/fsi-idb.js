'use strict';

const { generateUUID } = require('metautil');

const defaultOptions = {
  name: 'gs-fsi',
  version: 1,
  storeName: 'nodes',
  indexName: 'idx_node',
  rootNode: {
    id: 'root',
    parentId: null,
    name: '/',
    type: 'folder',
    content: null,
  },
};

let dbRequest = null;

const once = (req) => {
  const { promise, resolve, reject } = Promise.withResolvers();
  const ac = new AbortController();
  const { signal } = ac;
  req.addEventListener('success', (e) => resolve(e.target.result), { signal });
  req.addEventListener('error', (e) => reject(e.target.error), { signal });
  return promise.finally(() => ac.abort());
};

const openDB = async (options = defaultOptions) => {
  if (dbRequest) 
    return dbRequest.result ? dbRequest.result : await once(dbRequest);
  const normalizedOptions = { ...defaultOptions, ...options };
  const { name, version, storeName, indexName, rootNode } = normalizedOptions;
  dbRequest = indexedDB.open(name, version);
  dbRequest.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (db.objectStoreNames.contains(storeName)) return;
    const store = db.createObjectStore(storeName, { keyPath: 'id' });
    store.createIndex(indexName, ['parentId', 'name'], { unique: true });
    store.add(rootNode);
  };
  return await once(dbRequest);
};

const defaultQuery = ({ nodeId, store }) => once(store.get(nodeId));

const queryPath = async (dirPath, options = {}, query = defaultQuery) => {
  const { create = false, mode = 'readonly' } = options;
  const { storeName, indexName, rootNode } = defaultOptions;
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const index = store.index(indexName);
  const parts = dirPath.split('/').filter(Boolean);
  let currentNodeId = rootNode.id;
  for (const part of parts) {
    const nodeId = await once(index.getKey([currentNodeId, part]));
    if (nodeId) {
      currentNodeId = nodeId;
      continue;
    }
    if (!create) 
      throw new DOMException('Directory not found', 'NotFoundError');
    const node = {
      id: generateUUID(),
      parentId: currentNodeId,
      name: part,
      type: 'folder',
      content: null,
    };
    currentNodeId = await once(store.add(node));
  }
  return await query({ nodeId: currentNodeId, store, index });
};

const read = async (dirPath, filename) => {
  const query = ({ nodeId, index }) => once(index.get([nodeId, filename]));
  const node = await queryPath(dirPath, { mode: 'readonly' }, query);
  if (!node) throw new DOMException('File not found', 'NotFoundError');
  return node.content;
};

const write = async (dirPath, filename, content) => {
  const query = async ({ nodeId, store, index }) => {
    const node = await once(index.get([nodeId, filename]));
    if (node) {
      node.content = content;
      return once(store.put(node));
    }
    const fileNode = {
      id: generateUUID(),
      parentId: nodeId,
      name: filename,
      type: 'file',
      content,
    };
    return once(store.add(fileNode));
  };
  await queryPath(dirPath, { create: true, mode: 'readwrite' }, query);
};

const exists = async (dirPath, filename) => {
  try {
    const query = ({ nodeId, index }) => once(index.getKey([nodeId, filename]));
    const nodeId = await queryPath(dirPath, { mode: 'readonly' }, query);
    return nodeId !== undefined;
  } catch {
    return false;
  }
};

const remove = async (dirPath, filename) => {
  try {
    const query = async ({ nodeId, store, index }) => {
      const fileId = await once(index.getKey([nodeId, filename]));
      if (fileId) await once(store.delete(fileId));
    };
    await queryPath(dirPath, { mode: 'readwrite' }, query);
  } catch {
    return;
  }
};

module.exports = { read, write, exists, remove };
