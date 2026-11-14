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

### Install

Requires **Node.js 22+**.

```bash
npm install globalstorage
```

### Usage

- **Node.js** loads the CommonJS entry `globalstorage.js`.
- **Browser** exports `globalstorage.mjs` (ESM).
- **TypeScript** types for development are maintained in [`globalstorage.d.ts`](./globalstorage.d.ts).

### CRDT

Records are synchronized with delta-state CRDT: a delta is a part of a
record state, and `merge(state, delta)` joins them. For CRDT values the join
is idempotent, commutative, and associative, so replicas reach the same state
when they receive the same deltas, repeated or in any order. A full state is a
delta too.

| Value    | Shape                                        | Join                       | `materialize`           |
| -------- | -------------------------------------------- | -------------------------- | ----------------------- |
| Register | `{ $lww: { value, time, replica } }`         | later `time`, then replica | `value`, `null` removes |
| Counter  | `{ $counter: { inc: { r1: 3 }, dec: { } } }` | maximum for each replica   | sum of `inc` - `dec`    |
| Set      | `[1, 'a', true]` primitives                  | sorted union               | array                   |
| Map      | `{ key: value }` of values above             | join for each key          | object                  |

Plain values outside CRDT shapes follow merge patch rules: the delta replaces
them and `undefined` removes a key. They never replace a register or counter.

```js
const { assign, increment, merge, materialize, diff } = globalStorage;

const stamp = { time: Date.now(), replica: 'r1' };
let state = merge({}, assign({ title: 'Hello' }, stamp));
const previous = state;
state = merge(state, increment(state, ['likes'], 1, 'r1'));
materialize(state); // { title: 'Hello', likes: 1 }
diff(previous, state); // { likes: { $counter: { inc: { r1: 1 }, dec: {} } } }
```

| Function                                  | Result                                       |
| ----------------------------------------- | -------------------------------------------- |
| `merge(state, delta)`                     | Joined state, `state` itself when unchanged  |
| `apply(state, deltas)`                    | State after merging deltas in order          |
| `diff(source, target)`                    | Delta of what `target` adds to `source`      |
| `materialize(state)`                      | Plain JSON value of a state                  |
| `assign(fields, { time, replica })`       | Delta with a register for each field         |
| `increment(state, path, amount, replica)` | Delta raising this replica's counter entry   |
| `latestTime(state)`                       | Latest register time, for a hybrid clock     |
| `isDelta(value)`                          | Whether a value from network is a CRDT delta |

### Replica

`Replica` keeps records as CRDT states and logs every delta that changed
them. Deltas are envelopes `{ id, entity, target, data }`: `target` is the
record id and `data` is a CRDT delta for it. A delta that adds nothing to the
state is not logged, so deltas going around between replicas stop.

```js
const chat = await new Replica({ path: 'chat', validate }).open();
chat.assign('message', id, { username, content, timestamp });
chat.increment('message', id, ['reactions', 'like']);
chat.get(id); // { username, content, timestamp, reactions: { like: 1 } }
chat.on('log', ({ deltas, position, origin }) => {});
const fresh = chat.merge(deltasFromPeer, 'peer');
```

Without `path` the replica lives in memory. With `path` it is stored by
`fsi`: OPFS in browsers and the file system in Node.js. The log is split into
segments of 256 deltas, `meta.json` keeps the replica id, log length, and link
cursors. Segments are read in parallel on open; cursors are saved with the
next log write or a second later, a stale cursor only repeats a pull or push. On open the log is replayed, and a log shorter than recorded gets a
new replica id, so other replicas send their data again.

| Member                                     | Description                                     |
| ------------------------------------------ | ----------------------------------------------- |
| `open()`                                   | Loads a stored replica, required before changes |
| `id`                                       | Replica id, used for own registers and counters |
| `position`                                 | Log length                                      |
| `get(target)`, `keys(entity?)`, `size`     | Materialized records, ids of an entity          |
| `state(target)`                            | CRDT state of a record                          |
| `assign(entity, target, fields)`           | Own write of registers, returns the delta       |
| `increment(entity, target, path, amount?)` | Own counter change, returns the delta           |
| `merge(deltas, origin?)`                   | Applies deltas from elsewhere, returns fresh    |
| `since(position, limit?)`                  | `{ deltas, position }` for other replicas       |
| `origin(position)`                         | Where a logged delta came from                  |
| `getLink(name)`, `setLink(name, link)`     | Stored `{ source, pulled, pushed }` cursors     |
| `clear()`                                  | Removes data and takes a new replica id         |
| `cleared`                                  | Ids of logs cleared on purpose, the latest last |
| `save()`                                   | Waits for pending writes                        |

Events: `log` with `{ deltas, position, origin }` after fresh deltas,
`clear`, and `error` for failed background writes. `validate(delta)` is an
optional application check, it runs after the CRDT shape check.

### Sync over Metacom

`SyncService` serves a replica as a [metacom](https://github.com/metarhia/metacom)
unit and `Uplink` syncs another replica with it. Globalstorage does not
create connections: pass a metacom server, `MetacomProxy`, `MetacomPeer`, or
client connection you already have, so one protocol works from server to
service worker, to tabs, and between peers over WebRTC.

```js
// Node.js: metacom application unit
const replica = await new Replica({ path: './data' }).open();
const service = new SyncService(replica, { unit: 'sync' });
const api = { sync: service.api };

// Browser or Node.js client
const local = new Replica();
const metacom = Metacom.create('wss://example.com/api');
const uplink = new Uplink(local, metacom, { unit: 'sync', name: 'server' });
uplink.start();
await metacom.open();
```

| Call                         | Result                                           |
| ---------------------------- | ------------------------------------------------ |
| `subscribe()`                | Caller's `context.client` receives `<unit>/log`  |
| `pull({ source, position })` | `{ source, deltas, position, more, cleared }`    |
| `push({ deltas })`           | `{ source, position, applied }` after merge      |
| event `log`                  | `{ source, deltas, position }` with fresh deltas |

`source` is the served replica id: a cursor is a position in that replica's
log. When the id changes, the uplink cleared, lost, or replaced its log:
`Uplink` pulls from zero and pushes its whole log again. With option
`clear: 'follow'` an uplink cleared on purpose (its old id is in `cleared`)
clears this replica too, so a local cache follows the clear instead of
filling the uplink again. SyncService sends an empty `log` event with the
new id when its replica is cleared, so subscribers learn it at once. An event that does not
continue the cursor makes `Uplink` pull. Own deltas are pushed after each
connect and each change, deltas received from the uplink are not pushed back.
Cursors are kept in replica links under the uplink `name`.

`SyncService` options: `unit` (`'sync'`) names the `log` event, and `name`
(`'downlink'`) marks the origin of pushed deltas. `subscribe` keeps
`context.client` of the caller until its `close` event: metacom server,
`MetacomProxy`, and `MetacomPeer` handlers all have it. Event data is frozen,
so metacom serializes an event once for all subscribers. `Uplink` options: `unit`
(`'sync'`), `name` (`'uplink'`), and `clear` (`'resend'` or `'follow'`). `start()` and `stop()` attach and detach
its listeners; `sync()`, `pull()`, and `flush()` resolve to `true` when
everything is sent.

### Ideal For

- Local-first apps
- Real-time collaboration tools
- P2P distributed systems
- Full-stack JavaScript projects
- Blockchain-based data pipelines

### Additional features

- Built-in database engine will minimize interprocess communication to access data
- Minimize data transformations: all data should be stored, transmitted, handled and placed in RAM in the same format
- Maximum memory usage, read-ahead and lazy-write, minimizing data conversion
- Using metadata everywhere, special declarative format for subject domein representation (including fields, relations, and indices), memory structures, GUI, API, etc.
- The same API for client-side runtime and server-side runtime:
  - server-side storage engine
  - client-side storage engine (multiple implementations for different platforms including mobile, desktop and browser)
  - sharding for distributed storage of large data amounts, geo-distribution, save backup copies, access load balancing
  - allows user to exchange data in P2P mode
- Synchronization between client and server in realtime (close to realtime) and in lazy mode
- Offline-first approach: applications can work in online and offline (with locally stored data)
- Bidirectional data sync with CRDT and hierarchical versioning like git have
- Global data structures unification for applications working with [Metarhia](https://github.com/metarhia/Metarhia) technological stack and [Impress](https://github.com/metarhia/impress) application server
- Ability to work with non-unified data structures (custom schemas), specific to certain subject domain
- Data structures have global distributed identification system, so data can be inserted anywhere and will not bring ID conflicts
- Data reliability is provided by distributed storage facilities, so each data structure should have master server and multiple backup and cache servers; using those servers globalstorage supports addressing, versioning and branching

## Contributors

See GitHub for full [contributors list](https://github.com/metarhia/globalstorage/graphs/contributors)
