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
