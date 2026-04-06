'use strict';

class MockFileHandle {
  #entry = null;

  constructor(entry) {
    this.#entry = entry;
  }

  async getFile() {
    const content = this.#entry.content;
    return {
      text: async () => content,
    };
  }

  async createWritable() {
    const entry = this.#entry;
    const chunks = [];
    return {
      write: async (data) => {
        chunks.push(typeof data === 'string' ? data : String(data));
      },
      close: async () => {
        entry.content = chunks.join('');
      },
    };
  }
}

class MockDirectoryHandle {
  #entries = null;

  constructor(entries) {
    this.#entries = entries;
  }

  async getDirectoryHandle(name, { create } = {}) {
    if (!this.#entries.has(name)) {
      if (!create) {
        throw new DOMException(`Directory ${name} not found`, 'NotFoundError');
      }
      this.#entries.set(name, { type: 'dir', map: new Map() });
    }
    const entry = this.#entries.get(name);
    if (entry.type !== 'dir') {
      throw new DOMException('Not a directory', 'TypeMismatchError');
    }
    return new MockDirectoryHandle(entry.map);
  }

  async getFileHandle(name, { create } = {}) {
    if (!this.#entries.has(name)) {
      if (!create) {
        throw new DOMException(`File ${name} not found`, 'NotFoundError');
      }
      this.#entries.set(name, { type: 'file', content: '' });
    }
    const entry = this.#entries.get(name);
    if (entry.type !== 'file') {
      throw new DOMException('Not a file', 'TypeMismatchError');
    }
    return new MockFileHandle(entry);
  }

  async removeEntry(name) {
    if (!this.#entries.has(name)) {
      throw new DOMException(`Entry ${name} not found`, 'NotFoundError');
    }
    this.#entries.delete(name);
  }
}

const installMockOpfs = () => {
  const rootMap = new Map();
  const prevNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  );

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    enumerable: true,
    value: {
      storage: {
        getDirectory: async () => new MockDirectoryHandle(rootMap),
      },
    },
  });

  const reset = () => {
    rootMap.clear();
  };

  const uninstall = () => {
    if (prevNavigator) {
      Object.defineProperty(globalThis, 'navigator', prevNavigator);
    } else {
      delete globalThis.navigator;
    }
  };

  return { reset, uninstall, rootMap };
};

module.exports = { installMockOpfs };
