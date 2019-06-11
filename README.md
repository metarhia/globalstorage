# GlobalStorage

[![TravisCI](https://travis-ci.org/metarhia/globalstorage.svg?branch=master)](https://travis-ci.org/metarhia/globalstorage)
[![NPM Version](https://badge.fury.io/js/globalstorage.svg)](https://badge.fury.io/js/globalstorage)
[![NPM Downloads/Month](https://img.shields.io/npm/dm/globalstorage.svg)](https://www.npmjs.com/package/globalstorage)
[![NPM Downloads](https://img.shields.io/npm/dt/globalstorage.svg)](https://www.npmjs.com/package/globalstorage)

## The Concept

This is a distributed DBMS for technological stack [Metarhia](https://github.com/metarhia/Metarhia) and it is built with following assumptions:

- GS is designed to be built-in DBMS, to work inside [Impress Applications Server](https://github.com/metarhia/impress); it is needed to avoid or minimize interprocess communication to access DB;
- GS is compatible with JSTP [JavaScript Transfer Protocol](https://github.com/metarhia/jstp), all data slould be stored, stansmitted, handled and placed in RAM in the same format;
- All data structures can be reduced to array representation to redice size by removing key names, we can do that with the help of metadata schemas and we can dynamicaly build prototypes from schemas and assign them to arrays, so getters/setters will convert access by name (hash) to assess by position (array);
- Maximum memory usage, read-ahead and lazy-write, minimizing data conversion;
- Using metadata everywhere, special declarative format for subject domein representation including fields, relations, and indices so we can automatically build a storage scheme in the relational database, memory structures and structure for the database, different the GUI, API server, etc.
- The same API for client-side runtime and server-side runtime:
  - server-side storage engine;
  - client-side storage engine (multiple implementations for different platforms including mobile, desktop and browser);
  - sharding for distributed storage of large data amounts, geo-distribution, save backup copies, access load balancing;
  - allows user to exchange data in P2P mode;
- Syncronization between client and server in realtime (close to realtime) and in lazy mode; so applications can work in online and offline (with locally stored data); having bidirectional data sync and hieratchical versioning like git have;
- Global data structures unification for applications working with [Metarhia](https://github.com/metarhia/Metarhia) technological stack: [GlobalStorage](https://github.com/metarhia/globalgtorage), [Impress](https://github.com/metarhia/impress), [JSTP](https://github.com/metarhia/jstp) and [Console](https://github.com/metarhia/console) through moderated distributed metadata repositories;
- Ability to work with non-unified data structures (custom schemas), specific to certain subject domain;
- GlobalStorage provides DAC (data access layer) abstraction, it substitutes ORM but it does not necessarily make maping on the relational model (though RDBMS are also supported);
- Data structures have global distributed identification system, so data can be inserted anywhere and will not bring ID conflicts;
- Data reliability is provided by distributed storage facilities, so each data structure should have master server and multiple backup and cache servers; using those servers GlobalStorage supports addressing, versioning and branching.

## Metamodel Definition Language

Using this domain specific language we will describe subject domain in declarative format. To build GUI, API, business-loguic, data structures dynamically in runtime. For example we can build JavaScript prototype and assign it to positional array to access fields by name, so arrays will work like objects.

Example:

```js
{
  code: { type: 'string', primary: true },
  name: {
    caption: 'City',
    type: 'string',
    size: 32,
    nullable: false,
    index: { unique: false },
    master: { dataset: 'Cities', key: 'name' }
  },
  birth: 'Date',
  city: 'string',
  addresses: {
    type: { array: 'Address' }
  },
  gender: {
    type: 'char',
    lookup: { dictionary: { M: 'Male', F: 'Female' } }
  },
  age: function() {
    var difference = new Date() - this.birth;
    return Math.floor(difference / 31536000000);
  }
}
```

Data types:

- Built-in JavaScript types: string, number, boolean, Date, etc.
- Global Storage types: id, uid, tree, ip, etc.
- RDBMS data types: char, int, real, text, money, time, date...
- Links to other data structures in GlobalStorage
- Links to other data structures in Application

## JavaScript Query Language

JSQL is a query language for data structures manipulation. JSQL have syntax for:
filter, projection, dataset join and set operations. We have a separate
repository for examples and specification:
[metarhia/JSQL](https://github.com/metarhia/JSQL). Current Implementation can
be found in [`lib/transformations.js`](lib/transformations.js).

## Contributors

See github for full [contributors list](https://github.com/metarhia/globalstorage/graphs/contributors)

## API

### gs(provider, options)

- `provider`: [`<string>`][string] provider name
- `options`: [`<Object>`][object]
  - `serverSuffix`: [`<Uint64>`][uint64] optional
  - `serverBitmask`: [`<Uint64>`][uint64] optional
  - `systemSuffix`: [`<Uint64>`][uint64] optional
  - `systemBitmas`: [`<Uint64>`][uint64] optional

Create provider

#### gs.schemaConfig

- [`<Object>`][object] metaschema config

### class Cursor

#### Cursor.prototype.constructor(options)

#### Cursor.prototype.definition(schema, category)

- `schema`: [`<Metaschema>`][metaschema]
- `category`: [`<string>`][string] schema name

_Returns:_ [`<this>`][this]

Attach schema

#### Cursor.prototype.enableLogging(provider, ctx, args)

#### Cursor.prototype.copy()

_Returns:_ [`<Cursor>`][cursor] new instance

Copy references to new dataset

#### Cursor.prototype.clone()

_Returns:_ [`<Cursor>`][cursor] new instance

Clone all dataset objects

#### Cursor.prototype.enroll(jsql)

- `jsql`: [`<Array>`][array] commands array

_Returns:_ [`<this>`][this]

Apply JSQL commands to dataset

#### Cursor.prototype.empty()

_Returns:_ [`<this>`][this]

Remove all instances from dataset

#### Cursor.prototype.from(arr)

- `arr`: [`<Iterable>`][iterable]

_Returns:_ [`<Cursor>`][cursor] new instance

Synchronous virtualization converts Array to Cursor

#### Cursor.prototype.map(fn)

_Returns:_ [`<this>`][this]

Lazy map

fn - [`<Function>`][function], map function

#### Cursor.prototype.projection(fields)

- `fields`: [`<string[]>`][string]|[`<Object>`][object] projection metadata
  array of field names or object with structure:
  `{ toKey: [ fromKey, functions... ] }`

_Returns:_ [`<this>`][this]

Declarative lazy projection

#### Cursor.prototype.filter(fn)

- `fn`: [`<Function>`][function] filtering function

_Returns:_ [`<this>`][this]

Lazy functional filter

#### Cursor.prototype.select(query)

- `query`: [`<Function>`][function] filtering expression

_Returns:_ [`<Cursor>`][cursor] new instance

Declarative lazy filter

#### Cursor.prototype.distinct()

_Returns:_ [`<this>`][this]

Lazy functional distinct filter

#### Cursor.prototype.sort(fn)

- `fn`: [`<Function>`][function] comparing function

_Returns:_ [`<this>`][this]

Lazy functional sort

#### Cursor.prototype.order(fields)

- `fields`: [`<string>`][string]|[`<string[]>`][string]

_Returns:_ [`<this>`][this]

Declarative lazy ascending sort

#### Cursor.prototype.desc(fields)

- `fields`: [`<string>`][string]|[`<string[]>`][string]

_Returns:_ [`<this>`][this]

Declarative lazy descending sort

#### Cursor.prototype.count(\[field\])

- `field`: [`<string>`][string] field to use for count, optional

_Returns:_ [`<this>`][this]

Calculate count

#### Cursor.prototype.sum(field)

- `field`: [`<string>`][string] field to use for sum

_Returns:_ [`<this>`][this]

Calculate sum

#### Cursor.prototype.avg(field)

- `field`: [`<string>`][string] field to use for avg

_Returns:_ [`<this>`][this]

Calculate avg

#### Cursor.prototype.max(field)

- `field`: [`<string>`][string] field to use for max

_Returns:_ [`<this>`][this]

Calculate max

#### Cursor.prototype.min(field)

- `field`: [`<string>`][string] field to use for min

_Returns:_ [`<this>`][this]

Calculate min

#### Cursor.prototype.col()

_Returns:_ [`<this>`][this]

Convert first column of dataset to Array

#### Cursor.prototype.row()

_Returns:_ [`<this>`][this]

Return first row from dataset

#### Cursor.prototype.one()

_Returns:_ [`<this>`][this]

Get single first record from dataset

#### Cursor.prototype.limit(count)

- `count`: [`<number>`][number]

_Returns:_ [`<this>`][this]

Get first n records from dataset

#### Cursor.prototype.offset(offset)

- `offset`: [`<number>`][number]

_Returns:_ [`<this>`][this]

Offset into the dataset

#### Cursor.prototype.union(cursor)

- `cursor`: [`<Cursor>`][cursor]

_Returns:_ [`<this>`][this]

Calculate union and put results to this Cursor instance

#### Cursor.prototype.intersection(cursor)

- `cursor`: [`<Cursor>`][cursor]

_Returns:_ [`<this>`][this]

Calculate intersection and put results to this Cursor instance

#### Cursor.prototype.difference(cursor)

- `cursor`: [`<Cursor>`][cursor]

_Returns:_ [`<this>`][this]

Calculate difference and put results to this Cursor instance

#### Cursor.prototype.complement(cursor)

- `cursor`: [`<Cursor>`][cursor]

_Returns:_ [`<this>`][this]

Calculate complement and put results to this Cursor instance

#### Cursor.prototype.selectToMemory(query)

#### async Cursor.prototype.continue(data)

- `data`: [`<Array>`][array] rows to date

_Returns:_ [`<Promise>`][promise]

Continue computations via i.e. MemoryCursor or other cursor

to handle remaining operations unsupported by current cursor

#### async Cursor.prototype.fetch(\[permissionChecker\])

- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Get results after applying consolidated jsql

### class StorageProvider

Abstract Storage Provider

#### StorageProvider.prototype.constructor(options)

- `options`: [`<Object>`][object]
  - `serverSuffix`: [`<Uint64>`][uint64] optional
  - `serverBitmask`: [`<Uint64>`][uint64] optional
  - `systemSuffix`: [`<Uint64>`][uint64] optional
  - `systemBitmas`: [`<Uint64>`][uint64] optional

Create StorageProvider

#### async StorageProvider.prototype.open(options)

- `options`: [`<Object>`][object]
  - `schema`: [`<Metaschema>`][metaschema]

_Returns:_ [`<Promise>`][promise]

Open StorageProvider

#### async StorageProvider.prototype.close()

_Returns:_ [`<Promise>`][promise]

Close StorageProvider

#### async StorageProvider.prototype.setup(options)

_Returns:_ [`<Promise>`][promise]

Setup StorageProvider

#### StorageProvider.prototype.enableLogging(ctx)

#### StorageProvider.prototype.error(name, ...ctx)

- `name`: [`<string>`][string] error name that must be equal to one of the
  values from the Action's Errors field
- `ctx`: [`<Array>`][array]

Utility method to generate `<ActionError>` from inside the Action

#### async StorageProvider.prototype.takeId()

_Returns:_ [`<Promise>`][promise]

Generate globally unique id

#### async StorageProvider.prototype.get(id\[, permissionChecker\])

- `id`: [`<string>`][string] globally unique object id
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Get object from GlobalStorage

#### async StorageProvider.prototype.getDetails(category, id, fieldName\[, permissionChecker\])

- `category`: [`<string>`][string] category to get details in
- `id`: [`<string>`][string] object id
- `fieldName`: [`<string>`][string] field with the Many decorator
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Get details for many-to-many link from GlobalStorage

#### async StorageProvider.prototype.set(obj\[, permissionChecker\])

- `obj`: [`<Object>`][object] to be stored
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Set object in GlobalStorage

#### async StorageProvider.prototype.create(category, obj\[, permissionChecker\])

- `category`: [`<string>`][string] category to store the object in
- `obj`: [`<Object>`][object] to be stored
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Create object in GlobalStorage

#### async StorageProvider.prototype.update(category, query, patch\[, permissionChecker\])

- `category`: [`<string>`][string] category to update the records in
- `query`: [`<Object>`][object] example: `{ Id }`
- `patch`: [`<Object>`][object] fields to update
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Update object in GlobalStorage

#### async StorageProvider.prototype.delete(category, query\[, permissionChecker\])

- `category`: [`<string>`][string] category to delete the records from
- `query`: [`<Object>`][object] example: `{ Id }`
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Delete object in GlobalStorage

#### async StorageProvider.prototype.linkDetails(category, field, fromId, toIds\[, permissionChecker\])

- `category`: [`<string>`][string] category with field having the Many decorator
- `field`: [`<string>`][string] field with the Many decorator
- `fromId`: [`<Uint64>`][uint64] Id of the record in category specified in the
  first argument
- `toIds`: [`<Uint64>`][uint64]|[`<Uint64[]>`][uint64] Id(s) of the record(s) in
  category specified in the Many decorator of the specified field
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Link records with Many relation between them

#### async StorageProvider.prototype.unlinkDetails(category, field, fromId, toIds\[, permissionChecker\])

- `category`: [`<string>`][string] category with field having the Many decorator
- `field`: [`<string>`][string] field with the Many decorator
- `fromId`: [`<Uint64>`][uint64] Id of the record in category specified in the
  first argument
- `toIds`: [`<Uint64>`][uint64]|[`<Uint64[]>`][uint64] Id(s) of the record(s) in
  category specified in the Many decorator of the specified field
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Unlink records with Many relation between them

#### StorageProvider.prototype.select(category, query\[, permissionChecker\])

- `category`: [`<string>`][string] category to select the records from
- `query`: [`<Object>`][object] fields conditions
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Cursor>`][cursor]

Select objects from GlobalStorage

#### async StorageProvider.prototype.execute(category, action, actionArgs\[, permissionChecker\])

- `category`: [`<string>`][string]|[`<null>`][null] category name or null to
  execute public action
- `action`: [`<string>`][string] action name
- `actionArgs`: [`<Object>`][object]
  - `context`: [`<Object>`][object]
  - `args`: [`<Object>`][object]
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `action`: [`<string>`][string]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Execute an action

#### StorageProvider.prototype.log(op, args, ctx, response)

#### StorageProvider.prototype.getSystemSuffix(id)

- `id`: [`<Uint64>`][uint64]

_Returns:_ [`<Uint64>`][uint64]

Get system suffix for given id

#### StorageProvider.prototype.curSystem(id)

- `id`: [`<Uint64>`][uint64]

_Returns:_ [`<boolean>`][boolean]

Check whether data with given id is stored on this system

#### StorageProvider.prototype.getServerSuffix(id)

- `id`: [`<Uint64>`][uint64]

_Returns:_ [`<Uint64>`][uint64]

Get server suffix for given id

#### StorageProvider.prototype.curServer(id)

- `id`: [`<Uint64>`][uint64]

_Returns:_ [`<boolean>`][boolean]

Check whether data with given id is stored on this server

#### StorageProvider.prototype.getLocalId(id)

- `id`: [`<Uint64>`][uint64]

_Returns:_ [`<Uint64>`][uint64]

Get id without system and server suffix

#### StorageProvider.prototype.parseId(id)

- `id`: [`<Uint64>`][uint64]

_Returns:_ [`<Object>`][object]

- `systemSuffix`: [`<Uint64>`][uint64] system suffix for given id
- `serverSuffix`: [`<Uint64>`][uint64] server suffix for given id
- `localId`: [`<Uint64>`][uint64] id without system and server suffix

Parse id

#### async StorageProvider.prototype.listApplications(\[filtererByRoles\])

- `filtererByRoles`: [`<Function>`][function] optional
  - `applications`: [`<string[]>`][string]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

List all available applications

#### async StorageProvider.prototype.listCategories(\[filtererByPermission\])

- `filtererByPermission`: [`<Function>`][function] optional
  - `categories`: [`<string[]>`][string]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

List all available categories

#### async StorageProvider.prototype.listActions(\[filtererByPermission\])

- `filtererByPermission`: [`<Function>`][function] optional
  - `actions`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

List all available actions

#### StorageProvider.prototype.createJstpApi()

#### async StorageProvider.prototype.getSchemaSources({ categoryList, actionLists, appList } = {})

#### async StorageProvider.prototype.getCategoryL10n(langTag, category)

#### async StorageProvider.prototype.getDomainsL10n(langTag)

#### async StorageProvider.prototype.getCommonL10n(langTag)

#### async StorageProvider.prototype.getFormL10n(langTag, category, form)

#### async StorageProvider.prototype.getActionL10n(langTag, category, action)

### class FsProvider extends [StorageProvider][storageprovider]

#### FsProvider.prototype.constructor(options // { path } where path is database location)

#### FsProvider.prototype.readStat(callback)

#### FsProvider.prototype.open(options, callback)

#### FsProvider.prototype.writeStat(callback)

#### FsProvider.prototype.close(callback)

#### FsProvider.prototype.takeId(callback)

#### FsProvider.prototype.get(id, callback)

#### FsProvider.prototype.create(obj, callback)

#### FsProvider.prototype.update(obj, callback)

#### FsProvider.prototype.delete(id, callback)

#### FsProvider.prototype.select(query, options, callback)

### class MemoryProvider extends [StorageProvider][storageprovider]

#### MemoryProvider.prototype.constructor(callback)

#### MemoryProvider.prototype.close(callback)

#### MemoryProvider.prototype.create(obj, callback)

### class PostgresProvider extends [StorageProvider][storageprovider]

#### PostgresProvider.prototype.constructor()

Create PostgresProvider

#### async PostgresProvider.prototype.open(options)

- `options`: [`<Object>`][object] to be passed to pg

_Returns:_ [`<Promise>`][promise]

Open PostgresProvider

#### async PostgresProvider.prototype.close()

_Returns:_ [`<Promise>`][promise]

Close PostgresProvider

#### async PostgresProvider.prototype.setup(options)

- `options`: [`<Object>`][object]
  - `maxIdCount`: [`<number>`][number]
  - `refillPercent`: [`<number>`][number]

_Returns:_ [`<Promise>`][promise]

Setup StorageProvider

#### async PostgresProvider.prototype.takeId(client)

- `client`: [`<pg.Pool>`][pg.pool]|[`<pg.Client>`][pg.client]

_Returns:_ [`<Promise>`][promise]

Generate globally unique id

#### async PostgresProvider.prototype.getCategoryById(id)

#### async PostgresProvider.prototype.beginTx(\[options\])

- `options`: [`<Object>`][object] transaction options
  - `isolationLevel`: [`<string>`][string] 'committed', 'repeatable', or
    'serializable'
  - `readOnly`: [`<boolean>`][boolean]
  - `deferrable`: [`<boolean>`][boolean]

_Returns:_ [`<Promise>`][promise]

Begin transaction, returns a Promise that resolves in an object containing

some of the methods of the current provider and also the methods `commit()`,
`rollback()`, and `release()`. For more detailed description of the options see
https://www.postgresql.org/docs/current/sql-set-transaction.html

#### async PostgresProvider.prototype.get(id\[, permissionChecker\])

- `id`: [`<string>`][string] globally unique object id
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Get object from GlobalStorage

#### async PostgresProvider.prototype.getDetails(category, id, fieldName\[, permissionChecker\])

- `category`: [`<string>`][string] category to get details in
- `id`: [`<string>`][string] object id
- `fieldName`: [`<string>`][string] field with the Many decorator
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Get details for many-to-many link from GlobalStorage

#### async PostgresProvider.prototype.set(obj\[, permissionChecker\])

- `obj`: [`<Object>`][object] to be stored
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Set object in GlobalStorage

#### async PostgresProvider.prototype.create(category, obj\[, permissionChecker\])

- `category`: [`<string>`][string] category to store the object in
- `obj`: [`<Object>`][object] to be stored
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Create object in GlobalStorage

#### async PostgresProvider.prototype.update(category, query, patch\[, permissionChecker\])

- `category`: [`<string>`][string] category to update the records in
- `query`: [`<Object>`][object] example: `{ Id }`
- `patch`: [`<Object>`][object] fields to update
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Update object in GlobalStorage

#### async PostgresProvider.prototype.delete(category, query\[, permissionChecker\])

- `category`: [`<string>`][string] category to delete the records from
- `query`: [`<Object>`][object] example: `{ Id }`
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Delete object in GlobalStorage

#### async PostgresProvider.prototype.linkDetails(category, field, fromId, toIds\[, permissionChecker\])

- `category`: [`<string>`][string] category with field having the Many decorator
- `field`: [`<string>`][string] field with the Many decorator
- `fromId`: [`<Uint64>`][uint64] Id of the record in category specified in the
  first argument
- `toIds`: [`<Uint64>`][uint64]|[`<Uint64[]>`][uint64] Id(s) of the record(s) in
  category specified in the Many decorator of the specified field
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Link records with Many relation between them

#### async PostgresProvider.prototype.unlinkDetails(category, field, fromId, toIds\[, permissionChecker\])

- `category`: [`<string>`][string] category with field having the Many decorator
- `field`: [`<string>`][string] field with the Many decorator
- `fromId`: [`<Uint64>`][uint64] Id of the record in category specified in the
  first argument
- `toIds`: [`<Uint64>`][uint64]|[`<Uint64[]>`][uint64] Id(s) of the record(s) in
  category specified in the Many decorator of the specified field
- `permissionChecker`: [`<Function>`][function] optional
  - `category`: [`<string>`][string]
  - `options`: [`<Object>`][object]
- _Returns:_ [`<Promise>`][promise]

_Returns:_ [`<Promise>`][promise]

Unlink records with Many relation between them

#### PostgresProvider.prototype.select(category, query)

- `category`: [`<string>`][string] category to select the records from
- `query`: [`<Object>`][object] fields conditions

_Returns:_ [`<Cursor>`][cursor]

Select objects from GlobalStorage

### class RemoteProvider extends [StorageProvider][storageprovider]

#### RemoteProvider.prototype.constructor(options = {})

#### async RemoteProvider.prototype.open(options)

- `options`: [`<Object>`][object] options for jstp connection
  - `transport`: [`<string>`][string] jstp transport name
  - `connectionArgs`: [`<Array>`][array] arguments to be passed to corresponding
    transport's connect method

_Returns:_ [`<Promise>`][promise]

Open RemoteProvider

#### async RemoteProvider.prototype.close()

_Returns:_ [`<Promise>`][promise]

Close RemoteProvider

#### async RemoteProvider.prototype.get(id)

- `id`: [`<string>`][string] globally unique record id

_Returns:_ [`<Promise>`][promise]

Get record from GlobalStorage

#### async RemoteProvider.prototype.getDetails(category, id, fieldName)

- `category`: [`<string>`][string] category to get details in
- `id`: [`<string>`][string] object id
- `fieldName`: [`<string>`][string] field with the Many decorator

_Returns:_ [`<Promise>`][promise]

Get details for many-to-many link from GlobalStorage

#### async RemoteProvider.prototype.set(record)

- `record`: [`<Object>`][object] record to be stored

_Returns:_ [`<Promise>`][promise]

Set record in GlobalStorage

#### async RemoteProvider.prototype.create(category, record)

- `category`: [`<string>`][string] category of record
- `record`: [`<Object>`][object] record to be stored

_Returns:_ [`<Promise>`][promise]

Create record in GlobalStorage

#### async RemoteProvider.prototype.update(category, query, patch)

- `category`: [`<string>`][string] category of record
- `query`: [`<Object>`][object] record, example: `{ Id }`
- `patch`: [`<Object>`][object] record, fields to update

_Returns:_ [`<Promise>`][promise]

Update record in GlobalStorage

#### async RemoteProvider.prototype.delete(category, query)

- `category`: [`<string>`][string] category of record
- `query`: [`<Object>`][object] record, example: `{ Id }`

_Returns:_ [`<Promise>`][promise]

Delete record in GlobalStorage

#### async RemoteProvider.prototype.unlinkDetails(category, field, fromId, toIds)

- `category`: [`<string>`][string] category with field having the Many decorator
- `field`: [`<string>`][string] field with the Many decorator
- `fromId`: [`<Uint64>`][uint64] Id of the record in category specified in the
  first argument
- `toIds`: [`<Uint64>`][uint64]|[`<Uint64[]>`][uint64] Id(s) of the record(s) in
  category specified in the Many decorator of the specified field

_Returns:_ [`<Promise>`][promise]

Unlink records with Many relation between them

#### async RemoteProvider.prototype.linkDetails(category, field, fromId, toIds)

- `category`: [`<string>`][string] category with field having the Many decorator
- `field`: [`<string>`][string] field with the Many decorator
- `fromId`: [`<Uint64>`][uint64] Id of the record in category specified in the
  first argument
- `toIds`: [`<Uint64>`][uint64]|[`<Uint64[]>`][uint64] Id(s) of the record(s) in
  category specified in the Many decorator of the specified field

_Returns:_ [`<Promise>`][promise]

Link records with Many relation between them

#### RemoteProvider.prototype.select(category, query)

- `category`: [`<string>`][string] category of record
- `query`: [`<Object>`][object] fields conditions

_Returns:_ [`<Cursor>`][cursor] cursor

Select record from GlobalStorage

#### async RemoteProvider.prototype.execute(category, action, actionArgs)

- `category`: [`<string>`][string]|[`<null>`][null] category name or null to
  execute public action
- `action`: [`<string>`][string] action name
- `actionArgs`: [`<Object>`][object]
  - `context`: [`<Object>`][object]
  - `args`: [`<Object>`][object]

_Returns:_ [`<Promise>`][promise]

Execute an action

#### async RemoteProvider.prototype.getSchemaSources()

#### async RemoteProvider.prototype.listCategories()

#### async RemoteProvider.prototype.listCategoriesPermissions()

_Returns:_ [`<Promise>`][promise]

List categories permission flags

#### async RemoteProvider.prototype.listActions()

#### async RemoteProvider.prototype.listApplications()

#### async RemoteProvider.prototype.getCategoryL10n(langTag, category)

#### async RemoteProvider.prototype.getDomainsL10n(langTag)

#### async RemoteProvider.prototype.getCommonL10n(langTag)

#### async RemoteProvider.prototype.getFormL10n(langTag, category, form)

#### async RemoteProvider.prototype.getActionL10n(langTag, category, action)

[pg.pool]: https://github.com/brianc/node-pg-pool
[pg.client]: https://github.com/brianc/node-postgres
[uint64]: https://github.com/metarhia/common#class-uint64
[metaschema]: https://github.com/metarhia/metaschema#class-metaschema
[cursor]: #class-cursor
[storageprovider]: #class-storageprovider
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[null]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Null_type
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[iterable]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
[this]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
