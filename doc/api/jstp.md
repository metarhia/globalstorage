# GlobalStorage JSTP API

## Server-side

#### Errors

Errors taken from [`lib/errors.js`][errors]:

| Code | Name |
| ---- | ---- |
| 1000 | NOT_IMPLEMENTED |
| 1001 | NOT_FOUND |
| 1002 | INVALID_SCHEMA |
| 1003 | INVALID_CATEGORY_TYPE |
| 1004 | INVALID_DELETION_OPERATION |
| 1005 | INVALID_CREATION_OPERATION |
| 1006 | NOT_AUTHORIZED |
| 1007 | INVALID_SIGNATURE |

### Interface `provider`

#### Methods

##### `get(id)`

Get a record by id.

###### Call arguments

* `id` [`<string>`][], id of the record

###### Callback arguments

* `record` [`<Object>`][]

---

##### `getDetails(id, fieldName)`

Get record's many-to-many details by id.

###### Call arguments

* `id` [`<string>`][], id of the record
* `fieldName` [`<string>`][], field with the Many decorator

###### Callback arguments

* `details` [`<Object>[]`][]

---

##### `set(record)`

Set a record, `Id` field must be present in the record for it to work.

###### Call arguments

* `record` [`<Object>`][]
  * `Id` [`<string>`][]

###### Callback arguments

None.

---

##### `create(category, record)`

Create a record in the specified category.

###### Call arguments

* `category` [`<string>`][]
* `record` [`<Object>`][]

###### Callback arguments

* `id` [`<string>`][], id of the created record

---

##### `update(category, query, patch)`

Update a record or multiple records that satisfy the `query` in the specified
category.

###### Call arguments

* `category` [`<string>`][]
* `query` [`<Object>`][]
* `patch` [`<Object>`][]

###### Callback arguments

* `count` [`<number>`][], updated records count

---

##### `linkDetails(category, field, fromId, toIds)`

Link records with Many relation between them.

###### Call arguments

* `category` [`<string>`][]
* `field` [`<string>`][]
* `fromId` [`<string>`][]
* `toIds` [`<string>`][] | [`<string[]>`][string]

###### Callback arguments

None.

---

##### `unlinkDetails(category, field, fromId, toIds)`

Unlink records with Many relation between them.

###### Call arguments

* `category` [`<string>`][]
* `field` [`<string>`][]
* `fromId` [`<string>`][]
* `toIds` [`<string>`][] | [`<string[]>`][string]

###### Callback arguments

None.

---

##### `delete(category, query)`

Delete a record or multiple records that satisfy the `query` in the specified
category.

###### Call arguments

* `category` [`<string>`][]
* `query` [`<Object>`][]

###### Callback arguments

* `count` [`<number>`][], deleted records count

---

##### `select(category, jsql)`

Select a record or multiple records in the category using provided jsql.

###### Call arguments

* `category` [`<string>`][]
* `jsql` [`<Object[]>`][object]

###### Callback arguments

* `data` [`<Object[]>`][object], fetched data

---

##### `execute(category, name, args)`

Execute an Action

###### Call arguments

* `category` [`<string>`][], category to execute action on
* `name` [`<string>`][], name of the Action
* `args` [`<Object>`][], arguments of the Action
    * `Identifier` [`<string>`][], optional
    * `Catalog` [`<string>`][], optional
    * `Subdivision` [`<string>`][], optional

###### Callback arguments

* `message` [`<string>`][], message returned by an action

[errors]: https://github.com/metarhia/globalstorage/blob/master/lib/errors.js
[`<Object>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[`<string>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[`<number>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
