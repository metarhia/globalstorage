# GlobalStorage

[![NPM Version](https://badge.fury.io/js/globalstorage.svg)](https://badge.fury.io/js/globalstorage)
[![NPM Downloads/Month](https://img.shields.io/npm/dm/globalstorage.svg)](https://www.npmjs.com/package/globalstorage)
[![NPM Downloads](https://img.shields.io/npm/dt/globalstorage.svg)](https://www.npmjs.com/package/globalstorage)

## The Concept

📦 `globalstorage` is a modular distributed database for JavaScript and the Web—featuring blockchain integrity, local-first sync, CRDTs, and smart contracts.

### Key Features

- **Distributed architecture** with global unique IDs and deterministic replication
- **Blockchain log** for tamper-proof operation history
- **JavaScript Smart Contracts** executed within your app
- **CRDT synchronization** for offline-first and P2P support
- **Local-first storage**: supports `fs`, `IndexedDB`, and `OPFS`
- **Metaschema-driven domain modeling** for validation and sync
- **CAS operations** for consistency and concurrency safety
- **Web-ready**: works in Web browsers and Node.js runtime
- **Secure transport** via `metacom` protocol and WebSocket
- **Crypto support**: RSA, SHA-256, and more
- **Built-in integration** with [Impress Application Server](https://github.com/metarhia/impress)

### Ideal For

- Local-first apps
- Real-time collaboration tools
- P2P distributed systems
- Full-stack JavaScript projects
- Blockchain-based data pipelines

### Additional features

- Built-in database engine will minimize interprocess communication to access data
- Minimize data transformations: all data slould be stored, stansmitted, handled and placed in RAM in the same format
- Maximum memory usage, read-ahead and lazy-write, minimizing data conversion
- Using metadata everywhere, special declarative format for subject domein representation (including fields, relations, and indices), memory structures, GUI, API, etc.
- The same API for client-side runtime and server-side runtime:
  - server-side storage engine
  - client-side storage engine (multiple implementations for different platforms including mobile, desktop and browser)
  - sharding for distributed storage of large data amounts, geo-distribution, save backup copies, access load balancing
  - allows user to exchange data in P2P mode
- Syncronization between client and server in realtime (close to realtime) and in lazy mode
- Offline-first approach: applications can work in online and offline (with locally stored data)
- Bidirectional data sync with CRDT and hieratchical versioning like git have
- Global data structures unification for applications working with [Metarhia](https://github.com/metarhia/Metarhia) technological stack and [Impress](https://github.com/metarhia/impress) application server
- Ability to work with non-unified data structures (custom schemas), specific to certain subject domain
- Data structures have global distributed identification system, so data can be inserted anywhere and will not bring ID conflicts
- Data reliability is provided by distributed storage facilities, so each data structure should have master server and multiple backup and cache servers; using those servers globalstorage supports addressing, versioning and branching

## Contributors

See github for full [contributors list](https://github.com/metarhia/globalstorage/graphs/contributors)
