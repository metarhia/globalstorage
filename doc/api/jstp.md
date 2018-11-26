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
| 1004 | NOT_AUTHORIZED |
| 1005 | INVALID_SIGNATURE |

### Interface `provider`

#### Methods

##### `get(id)`

Get a record by id.

###### Call arguments

* `id` [`<string>`][], id of the record

###### Callback arguments

* `record` [`<Object>`][]

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

* `message` [`<string>`][], message returned by an action

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

##### `execute(connection, category, name, args)`

Execute an Action

###### Call arguments

* `category` [`<string>`][]
* `name` [`<string>`][]
* `args` [`<Object>`][]

###### Callback arguments

* `data` [`<Object[]>`][object], fetched data

[errors]: https://github.com/metarhia/globalstorage/blob/master/lib/errors.js
[`<Object>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[`<string>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[`<number>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
