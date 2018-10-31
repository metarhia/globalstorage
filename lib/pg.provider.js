'use strict';

const path = require('path');

const metaschema = require('metaschema');
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
const { isGlobalCategory, isIgnoredCategory } = require('./schema.utils');

const recreateIdTrigger = Symbol('recreateIdTrigger');

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
    metaschema.load(path.join(__dirname, '../schemas/system'), err => {
      if (err) {
        callback(err);
        return;
      }

      this.pool = new pg.Pool(options);
      callback(null, this);
    });
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
        'CREATE TRIGGER idgen BEFORE UPDATE ON "Identifier"' +
        'FOR EACH STATEMENT EXECUTE FUNCTION idgen($1, $2, $3, $4)',
        [maxIdCount, refillPercent, this.gs.serverId, this.gs.serverIdBitCount],
        err => {
          callback(err);
        }
      );
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
    const categoryQuery = 'SELECT "Category" FROM "Identifier" WHERE "Id" = $1';
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
      const { Category } = res.rows[0];
      callback(null, Category);
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

      const objectQuery = `SELECT * FROM ${category} WHERE "Id" = $1`;
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

      const { valid, errors } = metaschema.validate(category, obj);
      if (!valid) {
        callback(new GSError(
          errorCodes.INVALID_SCHEMA,
          `Invalid schema provided: ${errors.join('; ')}`
        ));
        return;
      }

      let fields = Object.keys(obj)
        .filter(key => key !== 'Id');
      const values = fields.map(key => obj[key]);
      fields = fields.map(escapeIdentifier);
      const setQuery = `UPDATE ${category} SET (${fields.join(', ')}) = ` +
        `(${generateQueryParams(fields.length)})`;

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
    const { valid, errors } = metaschema.validate(category, obj);
    if (!valid) {
      callback(new GSError(
        errorCodes.INVALID_SCHEMA,
        `Invalid schema provided: ${errors.join('; ')}`
      ));
      return;
    }

    const categoryType = metaschema.categories.get(category).constructor.name;
    if (isIgnoredCategory(categoryType)) {
      callback(new GSError(
        errorCodes.INVALID_CATEGORY_TYPE,
        `Record creation in ignored category: ${category}`
      ));
      return;
    }

    if (isGlobalCategory(categoryType)) {
      this.pool.connect((err, client, done) => {
        if (err) {
          callback(err);
          return;
        }
        metasync.sequential([
          (ctx, cb) => {
            this.takeId(client, (err, id) => {
              ctx.id = id;
              cb(err);
            });
          },
          (ctx, cb) => {
            createRecord(client, ctx.id, err => {
              cb(err);
            });
          },
          (ctx, cb) => {
            client.query(
              'UPDATE "Identifier"' +
              ' SET "Status" = \'Actual\', "Change" = CURRENT_TIMESTAMP' +
              ' WHERE "Id" = $1',
              [ctx.id],
              err => {
                cb(err);
              }
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
      createRecord(this.pool, null, callback);
    }

    function createRecord(client, id, done) {
      let fields = Object.keys(obj)
        .filter(key => key !== 'Id');
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
    }
  }

  // Update object in GlobalStorage
  //   category - string, category to update the records in
  //   query - object, example: { Id }
  //   patch - object, fields to update
  //   callback - function(err, count)
  update(category, query, patch, callback) {
    const { valid, errors } = metaschema.validate(category, patch);
    if (!valid) {
      callback(new GSError(
        errorCodes.INVALID_SCHEMA,
        `Invalid schema provided: ${errors.join('; ')}`
      ));
      return;
    }

    let fields = Object.keys(patch);
    const values = fields.map(key => patch[key]);
    fields = fields.map(escapeIdentifier);
    const [where, whereParams] = buildWhere(query);
    const updateQuery = `UPDATE ${escapeIdentifier(category)} SET ` +
      `(${fields.join(', ')}) = ` +
      `(${generateQueryParams(fields.length, whereParams.length + 1)})` +
      where;
    this.pool.query(updateQuery, whereParams.concat(values), (err, res) => {
      callback(err, res.rowCount);
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
      callback(err, res.rowCount);
    });
  }

  // Select objects from GlobalStorage
  //   category - string, category to select the records from
  //   query - fields conditions
  // Returns: Cursor
  select(category, query) {
    return new PostgresCursor(this.poll, { category }).select(query);
  }
}

module.exports = { PostgresProvider };
