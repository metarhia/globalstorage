'use strict';

const common = require('@metarhia/common');
const { extractDecorator } = require('metaschema');
const metasync = require('metasync');
const pg = require('pg');

const { GSError, codes: errorCodes } = require('./errors');
const { StorageProvider } = require('./provider');
const {
  generateQueryParams,
  escapeIdentifier,
  buildWhere,
} = require('./pg.utils');
const { PostgresCursor } = require('./pg.cursor');
const {
  isGlobalCategory,
  isIgnoredCategory,
  getCategoryRealm,
  getCategoryFamily,
  getCategoryActions,
  extractIncludeCategoriesData,
} = require('./schema.utils');

const recreateIdTrigger = Symbol('recreateIdTrigger');
const uploadCategoriesAndActions = Symbol('uploadCategoriesAndActions');

class PostgresProvider extends StorageProvider {
  // Create PostgresProvider
  //   gs - globalstorage instance
  constructor(gs) {
    super(gs);

    this.pool = null;
  }

  // Open PostgresProvider
  //   options - object, passed to pg
  //   callback - function(err, StorageProvider)
  open(options, callback) {
    this.pool = new pg.Pool(options);
    callback(null, this);
  }

  // Close PostgresProvider
  //   callback - function(err)
  close(callback) {
    if (!this.pool) {
      callback();
      return;
    }

    this.pool.end(() => {
      this.pool = null;
      callback();
    });
  }

  [recreateIdTrigger](maxIdCount, refillPercent, callback) {
    this.pool.query('DROP TRIGGER IF EXISTS idgen ON "Identifier"', err => {
      if (err) {
        callback(err);
      }

      this.pool.query(
        'SELECT trigger_creator($1, $2, $3, $4)',
        [maxIdCount, refillPercent, this.gs.serverId, this.gs.serverIdBitCount],
        err => {
          callback(err);
        }
      );
    });
  }

  [uploadCategoriesAndActions](callback) {
    const categories = common.iter(this.gs.schema.categories)
      .filter(([, { definition: value }]) => !isIgnoredCategory(value))
      .map(([Name, { definition: value }]) => ({
        Name,
        Realm: getCategoryRealm(value),
        Family: getCategoryFamily(value),
        // TODO: remove Version when metaschema will be able to work with the
        // default values
        Version: 0,
      })).toArray();
    const [ Category ] = categories.splice(
      categories.findIndex(c => c.Name === 'Category'), 1
    );
    metasync.sequential([
      (ctx, callback) => {
        this.create('Category', Category, (err, id) => {
          Category.Id = id;
          callback(err);
        });
      },
      (ctx, callback) => {
        this.update('Identifier', {
          Id: Category.Id,
        }, {
          Category: Category.Id,
        }, err => {
          callback(err);
        });
      },
      (ctx, callback) => {
        metasync.series(
          categories,
          (value, callback) => {
            this.create('Category', value, (err, id) => {
              value.Id = id;
              callback(err);
            });
          },
          err => {
            callback(err);
          }
        );
      },
      (ctx, callback) => {
        metasync.series(
          common.iter(categories).flatMap(c => {
            const actions = getCategoryActions(
              this.gs.schema.categories.get(c.Name).definition
            );
            actions.forEach(a => {
              a.Category = c.Id;
            });
            return actions;
          }).toArray(),
          (value, callback) => {
            this.create('Action', value, err => {
              callback(err);
            });
          },
          err => {
            callback(err);
          }
        );
      },
    ], err => {
      callback(err);
    });
  }

  // Generate globally unique id
  //   client - pg.Pool or pg.Client instance
  //   callback - function(err, id)
  takeId(client, callback) {
    const takeIdQuery = 'UPDATE "Identifier"' +
      ' SET "Status" = \'Init\', "Change" = CURRENT_TIMESTAMP' +
      ' WHERE "Id" = (SELECT min("Id")' +
      ' FROM "Identifier"' +
      ' WHERE "Status" = \'Prealloc\' AND "StorageKind" = \'Master\'' +
      ') RETURNING "Id"';
    client.query(takeIdQuery, (err, res) => {
      if (err) {
        callback(err);
        return;
      }

      if (res.rowCount === 0) {
        callback(new GSError(
          errorCodes.NOT_FOUND,
          'Cannot get Id to use for object creation'
        ));
        return;
      }

      callback(null, res.rows[0].Id);
    });
  }

  getCategoryById(id, callback) {
    const categoryQuery = 'SELECT "Category"."Name"' +
      ' FROM "Identifier", "Category"' +
      ' WHERE "Identifier"."Category" = "Category"."Id" AND' +
      ' "Identifier"."Id" = $1';
    this.pool.query(categoryQuery, [id], (err, res) => {
      if (err) {
        callback(err);
        return;
      }
      if (res.rowCount === 0) {
        callback(new GSError(
          errorCodes.NOT_FOUND,
          `No object with Id ${id} available`
        ));
        return;
      }
      const { Name } = res.rows[0];
      callback(null, Name);
    });
  }

  // Get object from GlobalStorage
  //   id - globally unique object id
  //   callback - function(err, obj)
  get(id, callback) {
    this.getCategoryById(id, (err, category) => {
      if (err) {
        callback(err);
        return;
      }

      const objectQuery = `SELECT * FROM ${escapeIdentifier(category)}` +
        ' WHERE "Id" = $1';
      this.pool.query(objectQuery, [id], (err, res) => {
        if (err) {
          callback(err);
          return;
        }

        if (res.rowCount === 0) {
          callback(new GSError(
            errorCodes.NOT_FOUND,
            `No object with Id ${id} available`
          ));
          return;
        }

        callback(null, res.rows[0]);
      });
    });
  }

  // Set object in GlobalStorage
  //   obj - object to be stored
  //   callback - function(err)
  set(obj, callback) {
    if (!obj.Id) {
      throw new TypeError('Id is not provided');
    }

    this.getCategoryById(obj.Id, (err, category) => {
      if (err) {
        callback(err);
        return;
      }

      // TODO: get rid of the next copying and field deletion, when validation
      // will allow for fields that are not present in schemas to be present in
      // the object being validated
      const toValidate = Object.assign({}, obj);
      delete toValidate.Id;

      const error = this.gs.schema.validateCategory(category, toValidate);
      if (error) {
        callback(new GSError(
          errorCodes.INVALID_SCHEMA,
          `Invalid schema provided: ${error.toString()}`
        ));
        return;
      }

      let fields = Object.keys(obj)
        .filter(key => key !== 'Id');
      const values = fields.map(key => obj[key]);
      values.unshift(obj.Id);
      fields = fields.map(escapeIdentifier);
      const setQuery = `UPDATE ${escapeIdentifier(category)}` +
        ` SET (${fields.join(', ')}) =` +
        ` ROW (${generateQueryParams(fields.length, 2)})` +
        ' WHERE "Id" = $1';

      this.pool.query(setQuery, values, err => {
        callback(err);
      });
    });
  }

  // Create object in GlobalStorage
  //   category - string, category to store the object in
  //   obj - object to be stored
  //   callback - function(err, id)
  create(category, obj, callback) {
    const error = this.gs.schema.validateCategory(category, obj);
    if (error) {
      process.nextTick(callback, new GSError(
        errorCodes.INVALID_SCHEMA,
        `Invalid schema provided: ${error.toString()}`
      ));
      return;
    }

    const categoryDefinition =
      this.gs.schema.categories.get(category).definition;
    if (isIgnoredCategory(categoryDefinition)) {
      process.nextTick(callback, new GSError(
        errorCodes.INVALID_CATEGORY_TYPE,
        `Record creation in ignored category: ${category}`
      ));
      return;
    }

    const createRecord = (category, obj, client, id, done) => {
      const categoryDefinition =
        this.gs.schema.categories.get(category).definition;
      let fields = Object.keys(obj).filter(key =>
        key !== 'Id' &&
        extractDecorator(categoryDefinition[key]) !== 'Include'
      );
      const values = fields.map(key => obj[key]);
      if (id) {
        fields.push('Id');
        values.push(id.toString());
      }
      fields = fields.map(escapeIdentifier);
      const createQuery = `INSERT INTO ${escapeIdentifier(category)} ` +
        `(${fields.join(', ')})` +
        ` VALUES (${generateQueryParams(fields.length)})` +
        ' RETURNING "Id"';
      client.query(createQuery, values, (err, res) => {
        if (err) {
          done(err);
          return;
        }

        done(null, res.rows.length > 0 && res.rows[0].Id);
      });
    };

    if (isGlobalCategory(categoryDefinition)) {
      this.pool.connect((err, client, done) => {
        if (err) {
          callback(err);
          return;
        }
        metasync.sequential([
          cb => {
            client.query('BEGIN', err => { cb(err); });
          },
          (ctx, cb) => {
            this.takeId(client, (err, id) => {
              ctx.id = id;
              cb(err);
            });
          },
          (ctx, cb) => {
            metasync.series(
              extractIncludeCategoriesData(categoryDefinition, obj),
              (data, cb) => {
                createRecord(data.category, data.value, client, ctx.id, err => {
                  cb(err);
                });
              },
              err => { cb(err); }
            );
          },
          (ctx, cb) => {
            createRecord(category, obj, client, ctx.id, err => { cb(err); });
          },
          (ctx, cb) => {
            client.query(
              'UPDATE "Identifier"' +
              ' SET "Status" = \'Actual\', "Change" = CURRENT_TIMESTAMP,' +
              ' "Category" = (SELECT "Id" FROM "Category" WHERE "Name" = $1),' +
              ' "Checksum" = (SELECT get_checksum($1, $2, \'sha512\'))' +
              ' WHERE "Id" = $2',
              [category, ctx.id],
              err => { cb(err); }
            );
          },
        ], (err, ctx) => {
          if (err) {
            client.query('ROLLBACK', rollbackError => {
              if (rollbackError) {
                callback(rollbackError);
              } else {
                callback(err);
              }
              done();
            });
            return;
          }

          client.query('COMMIT', err => {
            if (err) {
              callback(err);
            } else {
              callback(null, ctx.id);
            }
            done();
          });
        });
      });
    } else {
      createRecord(category, obj, this.pool, null, callback);
    }
  }

  // Update object in GlobalStorage
  //   category - string, category to update the records in
  //   query - object, example: { Id }
  //   patch - object, fields to update
  //   callback - function(err, count)
  update(category, query, patch, callback) {
    const error = this.gs.schema.validateCategory(category, patch, true);
    if (error) {
      process.nextTick(callback, new GSError(
        errorCodes.INVALID_SCHEMA,
        `Invalid schema provided: ${error.toString()}`
      ));
      return;
    }

    let fields = Object.keys(patch);
    const values = fields.map(key => patch[key]);
    fields = fields.map(escapeIdentifier);
    const [where, whereParams] = buildWhere(query);
    const updateQuery = `UPDATE ${escapeIdentifier(category)} SET ` +
      `(${fields.join(', ')}) = ` +
      `ROW (${generateQueryParams(fields.length, whereParams.length + 1)})` +
      where;
    this.pool.query(updateQuery, whereParams.concat(values), (err, res) => {
      callback(err, res && res.rowCount);
    });
  }

  // Delete object in GlobalStorage
  //   category - string, category to delete the records from
  //   query - object, example: { Id }
  //   callback - function(err, count)
  delete(category, query, callback) {
    const [where, whereParams] = buildWhere(query);
    const deleteQuery = `DELETE FROM ${escapeIdentifier(category)} ` +
      where;
    this.pool.query(deleteQuery, whereParams, (err, res) => {
      callback(err, res && res.rowCount);
    });
  }

  // Select objects from GlobalStorage
  //   category - string, category to select the records from
  //   query - fields conditions
  // Returns: Cursor
  select(category, query) {
    return new PostgresCursor(this.pool, { category }).select(query);
  }
}

module.exports = {
  PostgresProvider,
  recreateIdTrigger,
  uploadCategoriesAndActions,
};
