# GlobalStorage JSTP API

## Server-side

#### Errors

Errors taken from [`lib/errors.js`][errors]:

| Code | Name                       |
| ---- | -------------------------- |
| 999  | INTERNAL_PROVIDER_ERROR    |
| 1000 | NOT_IMPLEMENTED            |
| 1001 | NOT_FOUND                  |
| 1002 | INVALID_SCHEMA             |
| 1003 | INVALID_CATEGORY_TYPE      |
| 1004 | INVALID_DELETION_OPERATION |
| 1005 | INVALID_CREATION_OPERATION |
| 1006 | INSUFFICIENT_PERMISSIONS   |

### Interface `provider`

#### Methods

##### `get(id)`

Get a record by id.

###### Call arguments

- `id` [`<string>`][], id of the record

###### Callback arguments

- `record` [`<Object>`][object]

---

##### `getDetails(category, id, fieldName)`

Get record's many-to-many details by id in the specified category.

###### Call arguments

- `category` [`<string>`][]
- `id` [`<string>`][], id of the record
- `fieldName` [`<string>`][], field with the Many decorator

###### Callback arguments

- `details` [`<Object>[]`][object]

---

##### `set(record)`

Set a record, `Id` field must be present in the record for it to work.

###### Call arguments

- `record` [`<Object>`][object]
  - `Id` [`<string>`][]

###### Callback arguments

None.

---

##### `create(category, record)`

Create a record in the specified category.

###### Call arguments

- `category` [`<string>`][]
- `record` [`<Object>`][object]

###### Callback arguments

- `id` [`<string>`][], id of the created record

---

##### `update(category, query, patch)`

Update a record or multiple records that satisfy the `query` in the specified
category.

###### Call arguments

- `category` [`<string>`][]
- `query` [`<Object>`][object]
- `patch` [`<Object>`][object]

###### Callback arguments

- `count` [`<number>`][], updated records count

---

##### `linkDetails(category, field, fromId, toIds)`

Link records with Many relation between them.

###### Call arguments

- `category` [`<string>`][]
- `field` [`<string>`][]
- `fromId` [`<string>`][]
- `toIds` [`<string>`][] | [`<string[]>`][string]

###### Callback arguments

None.

---

##### `unlinkDetails(category, field, fromId, toIds)`

Unlink records with Many relation between them.

###### Call arguments

- `category` [`<string>`][]
- `field` [`<string>`][]
- `fromId` [`<string>`][]
- `toIds` [`<string>`][] | [`<string[]>`][string]

###### Callback arguments

None.

---

##### `delete(category, query)`

Delete a record or multiple records that satisfy the `query` in the specified
category.

###### Call arguments

- `category` [`<string>`][]
- `query` [`<Object>`][object]

###### Callback arguments

- `count` [`<number>`][], deleted records count

---

##### `select(category, jsql)`

Select a record or multiple records in the category using provided jsql.

###### Call arguments

- `category` [`<string>`][]
- `jsql` [`<Object[]>`][object]

###### Callback arguments

- `data` [`<Object[]>`][object], fetched data

---

##### `execute(category, action, actionArgs)`

Execute an action.

###### Call arguments

- `category` [`<string>`][] | [`<null>`][], if null is provided, execute a
  public action
- `action` [`<string>`][], action name
- `actionArgs` [`<Object>`][object]
  - `args` [`<Object>`][object]
  - `context` [`<Object>`][object]

###### Callback arguments

- `result` `<any>`

---

##### `getSchemaSources()`

Get all of the `metaschema` sources.

###### Call arguments

None.

###### Callback arguments

- `sources` [`<Object[]>`][object]
  - `type` [`<string>`][]
  - `module` [`<string>`][]
  - `name` [`<string>`][]
  - `source` [`<string>`][]

---

##### `listCategories()`

Get all of the available categories.

###### Call arguments

None.

###### Callback arguments

- `categories` [`<string[]>`][string]

---

##### `listCategoriesPermissions()`

Get all of the available categories permission flags.

###### Call arguments

None.

###### Callback arguments

- `categories` [`<Object>`][object]
  - `[categoryName]` [`<string>`][string] permission flags

---

##### `listActions()`

Get all of the available actions.

###### Call arguments

None.

###### Callback arguments

- `actions` [`<Object>`][object]
  - `public` [`<string[]>`][string], list of public actions
  - `private` [`<Object>`][object], private actions available by category name
    - `[categoryName]` [`<string[]>`][string], list of actions available in the
      specified category

---

##### `listApplications()`

Get all of the available applications.

###### Call arguments

None.

###### Callback arguments

- `applications` [`<string[]>`][string]

### Interface `l10n`

#### Methods

##### `getCategory(langTag, category)`

Get localization data for a category.

###### Call arguments

- `langTag` [`<string>`][], IETF BCP 47 language tag
- `category` [`<string>`][], category name

###### Callback arguments

- `localization` [`<string>`][], JSON-serialized localization data

---

##### `getDomains(langTag)`

Get localization data for domains.

###### Call arguments

- `langTag` [`<string>`][], IETF BCP 47 language tag

###### Callback arguments

- `localization` [`<string>`][], JSON-serialized localization data

---

##### `getCommon(langTag)`

Get localization data for common names.

###### Call arguments

- `langTag` [`<string>`][], IETF BCP 47 language tag

###### Callback arguments

- `localization` [`<string>`][], JSON-serialized localization data

---

##### `getForm(langTag, category, form)`

Get localization data for a form.

###### Call arguments

- `langTag` [`<string>`][], IETF BCP 47 language tag
- `category` [`<string>`][], category name
- `form` [`<string>`][], form name

###### Callback arguments

- `localization` [`<string>`][], JSON-serialized localization data

---

##### `getAction(langTag, category, action)`

Get localization data for an action.

###### Call arguments

- `langTag` [`<string>`][], IETF BCP 47 language tag
- `category` [`<string>`][] | [`<null>`][], action's category name, must be
  null if action is public
- `action` [`<string>`][], action name

###### Callback arguments

- `localization` [`<string>`][], JSON-serialized localization data

[errors]: https://github.com/metarhia/globalstorage/blob/master/lib/errors.js
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[`<string>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
[`<number>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
[`<null>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Null_type
