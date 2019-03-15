'use strict';

const fs = require('fs');
const path = require('path');

const common = require('@metarhia/common');
const { extractDecorator } = require('metaschema');
const metasync = require('metasync');
const pg = require('pg');

const { generateDDL } = require('./pg.ddl');
const { GSError, codes: errorCodes } = require('./errors');
const { StorageProvider } = require('./provider');
const {
  generateQueryParams,
  generateLinkQueryParams,
  escapeIdentifier,
  buildWhere,
  generateDeleteQuery,
  symbols: { recreateIdTrigger, uploadMetadata },
} = require('./pg.utils');
const { PostgresCursor } = require('./pg.cursor');
const {
  isGlobalCategory,
  isIgnoredCategory,
  getCategoryRealm,
  getCategoryFamily,
  constructActions,
  extractIncludeCategoriesData,
  extractIncludeCategories,
} = require('./schema.utils');
const { manyToManyTableName } = require('./ddl.utils');
const { runIfFn, runIf } = require('./utils');

class PostgresProvider extends StorageProvider {
  // Create PostgresProvider
  constructor(options) {
    super(options);

    this.pool = null;
    this.cursorFactory = (provider, category, jsql) =>
      new PostgresCursor(provider, { category, jsql });
  }

  // Open PostgresProvider
  //   options - <Object>, to be passed to pg
  //   callback - <Function>
  //     err - <Error> | <null>
  //     provider - <this>
  open(options, callback) {
    super.open(options, err => {
      if (err) {
        callback(err, this);
        return;
      }
      this.pool = new pg.Pool(options);
      this.active = true;
      process.nextTick(callback, null, this);
    });
  }

  // Close PostgresProvider
  //   callback - <Function>
  //     err - <Error> | <null>
  close(callback) {
    if (!this.pool) {
      callback();
      return;
    }

    this.pool.end(() => {
      this.pool = null;
      this.active = false;
      callback();
    });
  }

  // Setup StorageProvider
  //   options - <Object>
  //     maxIdCount - <number>
  //     refillPercent - <number>
  //   callback - <Function>
  //     err - <Error> | <null>
  setup(options, callback) {
    const { maxIdCount = 1000, refillPercent = 30 } = options || {};
    metasync.sequential(
      [
        (ctx, cb) => {
          fs.readFile(
            path.join(__dirname, '..', 'sql', 'id.sql'),
            'utf8',
            (err, initSql) => {
              ctx.initSql = initSql;
              cb(err);
            }
          );
        },
        (ctx, cb) => {
          this.pool.query(ctx.initSql, err => {
            cb(err);
          });
        },
        cb => {
          this.pool.query(generateDDL(this.schema), err => {
            cb(err);
          });
        },
        cb => {
          this[recreateIdTrigger](maxIdCount, refillPercent, cb);
        },
        cb => {
          this[uploadMetadata](cb);
        },
      ],
      err => {
        if (err && !(err instanceof GSError)) {
          this.systemLogger(err);
          callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
        } else {
          callback(err);
        }
      }
    );
  }

  [recreateIdTrigger](maxIdCount, refillPercent, callback) {
    this.pool.query('DROP TRIGGER IF EXISTS idgen ON "Identifier"', err => {
      if (err) {
        this.systemLogger(err);
        callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
      }

      this.pool.query(
        'SELECT trigger_creator($1, $2, $3, $4)',
        [maxIdCount, refillPercent, this.serverSuffix, this.serverBitmaskSize],
        err => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
          } else {
            callback();
          }
        }
      );
    });
  }

  [uploadMetadata](callback) {
    const categories = common
      .iter(this.schema.categories.values())
      .filter(({ definition: value }) => !isIgnoredCategory(value))
      .map(({ name: Name, definition: value }) => ({
        Name,
        Realm: getCategoryRealm(value),
        Family: getCategoryFamily(value),
        // TODO: remove Version when metaschema will be able to work with the
        // default values
        Version: 0,
      }))
      .toArray();
    const applications = common
      .iter(this.schema.applications.values())
      .map(({ name: Name, definition: value }) => ({
        Name,
        Categories: value.Categories.map(name =>
          categories.find(c => c.Name === name)
        ),
      }))
      .toArray();
    const [Category] = categories.splice(
      categories.findIndex(c => c.Name === 'Category'),
      1
    );
    metasync.sequential(
      [
        callback => {
          this.create('Category', Category, (err, id) => {
            Category.Id = id;
            callback(err);
          });
        },
        callback => {
          this.update(
            'Identifier',
            {
              Id: Category.Id,
            },
            {
              Category: Category.Id,
            },
            err => {
              callback(err);
            }
          );
        },
        callback => {
          metasync.each(
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
        callback => {
          metasync.each(
            common
              .iter(categories)
              .flatMap(c =>
                constructActions(
                  this.schema.categories.get(c.Name).actions,
                  false,
                  c.Id
                )
              )
              .chain(constructActions(this.schema.actions, true))
              .toArray(),
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
        callback => {
          metasync.each(
            applications,
            (app, callback) => {
              this.create(
                'Application',
                {
                  Name: app.Name,
                },
                (err, id) => {
                  if (err) {
                    callback(err);
                    return;
                  }

                  this.linkDetails(
                    'Application',
                    'Categories',
                    id,
                    app.Categories.map(c => c.Id),
                    err => {
                      callback(err);
                    }
                  );
                }
              );
            },
            err => {
              callback(err);
            }
          );
        },
      ],
      err => {
        if (err) {
          this.systemLogger(err);
          callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
        } else {
          callback();
        }
      }
    );
  }

  // Generate globally unique id
  //   client - <pg.Pool> | <pg.Client>
  //   callback - <Function>
  //     err - <Error> | <null>
  //     id - <string>
  takeId(client, callback) {
    const takeIdQuery =
      'UPDATE "Identifier"' +
      ' SET "Status" = \'Init\', "Change" = CURRENT_TIMESTAMP' +
      ' WHERE "Id" = (SELECT "Id"' +
      ' FROM "Identifier"' +
      ' WHERE "Status" = \'Prealloc\' AND "StorageKind" = \'Master\'' +
      ' ORDER BY "Id" LIMIT 1' +
      ' FOR UPDATE SKIP LOCKED) RETURNING "Id"';
    client.query(takeIdQuery, (err, res) => {
      if (err) {
        callback(err);
        return;
      }

      if (res.rowCount === 0) {
        callback(
          new GSError(
            errorCodes.NOT_FOUND,
            'Cannot get Id to use for object creation'
          )
        );
        return;
      }

      callback(null, res.rows[0].Id);
    });
  }

  getCategoryById(id, callback) {
    const categoryQuery =
      'SELECT "Category"."Name"' +
      ' FROM "Identifier", "Category"' +
      ' WHERE "Identifier"."Category" = "Category"."Id" AND' +
      ' "Identifier"."Id" = $1';
    this.pool.query(categoryQuery, [id], (err, res) => {
      if (err) {
        this.systemLogger(err);
        callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
        return;
      }
      if (res.rowCount === 0) {
        callback(
          new GSError(errorCodes.NOT_FOUND, `No object with Id ${id} available`)
        );
        return;
      }
      const { Name } = res.rows[0];
      callback(null, Name);
    });
  }

  // Get object from GlobalStorage
  //   id - <string>, globally unique object id
  //   callback - <Function>
  //     err - <Error> | <null>
  //     obj - <Object>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  get(id, callback, permissionChecker) {
    this.getCategoryById(id, (err, category) => {
      if (err) {
        callback(err);
        return;
      }

      this.select(category, { [`${category}.Id`]: id }).fetch((err, rows) => {
        if (err) {
          callback(err);
          return;
        }

        if (rows.length === 0) {
          callback(
            new GSError(
              errorCodes.NOT_FOUND,
              `No object with Id ${id} available`
            )
          );
          return;
        }
        const result = rows[0];
        runIfFn(permissionChecker, category, { record: result }, err => {
          if (err) {
            callback(err);
          } else {
            callback(null, result);
          }
        });
      });
    });
  }

  // Get details for many-to-many link from GlobalStorage
  //   category - <string>, category to get details in
  //   id - <string>, object id
  //   fieldName - <string>, field with the Many decorator
  //   callback - <Function>
  //     err - <Error> | <null>
  //     details - <Object[]>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  getDetails(category, id, fieldName, callback, permissionChecker) {
    const categorySchema = this.schema.categories.get(category);
    if (!categorySchema) {
      callback(
        new GSError(errorCodes.NOT_FOUND, `No category ${category} available`)
      );
      return;
    }
    const categoryDefinition = categorySchema.definition;
    const categoryField = categoryDefinition[fieldName];
    if (!categoryField || extractDecorator(categoryField) !== 'Many') {
      callback(
        new GSError(
          errorCodes.NOT_FOUND,
          `No 'Many' field ${fieldName} in object with Id ${id} available`
        )
      );
      return;
    }

    const rightCategory = categoryField.category;
    const rightCategorySchema = this.schema.categories.get(rightCategory);
    let requiresFiltering = false;
    runIf(
      permissionChecker,
      callback => {
        const args = [[category, { id }]];
        if (!rightCategorySchema.catalog && !rightCategorySchema.subsystem) {
          args.push([rightCategory, null]);
        } else {
          requiresFiltering = true;
        }
        metasync.each(
          args,
          (args, callback) => {
            permissionChecker(...args, callback);
          },
          err => {
            callback(err);
          }
        );
      },
      err => {
        if (err) {
          callback(err);
          return;
        }

        const escapedRightCategory = escapeIdentifier(rightCategory);
        const escapedManyTableName = escapeIdentifier(
          manyToManyTableName(category, rightCategory, fieldName)
        );

        this.pool.query(
          `SELECT ${escapedRightCategory}.* FROM ${escapedRightCategory} ` +
            `INNER JOIN ${escapedManyTableName} ON ${escapedRightCategory}."Id" =` +
            ` ${escapedManyTableName}.${escapeIdentifier(fieldName)}` +
            ` WHERE ${escapedManyTableName}` +
            `.${escapeIdentifier(category)} = $1`,
          [id],
          (err, res) => {
            if (err) {
              this.systemLogger(err);
              callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
            } else if (requiresFiltering) {
              metasync.filter(
                res.rows,
                (record, callback) => {
                  permissionChecker(rightCategory, { record }, err => {
                    if (err) {
                      if (err.code === errorCodes.INSUFFICIENT_PERMISSIONS) {
                        callback(null, false);
                      } else {
                        callback(err);
                      }
                    } else {
                      callback(null, true);
                    }
                  });
                },
                callback
              );
            } else {
              callback(null, res.rows);
            }
          }
        );
      }
    );
  }

  // Set object in GlobalStorage
  //   obj - <Object>, to be stored
  //   callback - <Function>
  //     err - <Error> | <null>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  set(obj, callback, permissionChecker) {
    if (!obj.Id) {
      throw new TypeError('Id is not provided');
    }

    const updateRecord = (category, obj, client, callback) => {
      const categoryDefinition = this.schema.categories.get(category)
        .definition;
      let fields = Object.keys(obj).filter(
        key =>
          key !== 'Id' &&
          extractDecorator(categoryDefinition[key]) !== 'Include'
      );
      const values = fields.map(key => obj[key]);
      values.unshift(obj.Id);
      fields = fields.map(escapeIdentifier);
      const setQuery =
        `UPDATE ${escapeIdentifier(category)}` +
        ` SET (${fields.join(', ')}) =` +
        ` ROW (${generateQueryParams(fields.length, 2)})` +
        ' WHERE "Id" = $1';

      client.query(setQuery, values, err => {
        callback(err);
      });
    };

    this.getCategoryById(obj.Id, (err, category) => {
      if (err) {
        callback(err);
        return;
      }
      const categoryDefinition = this.schema.categories.get(category)
        .definition;
      let error;
      [error, obj] = this.schema.createAndValidate('category', category, obj);
      if (error) {
        callback(
          new GSError(
            errorCodes.INVALID_SCHEMA,
            `Invalid schema provided: ${error}`
          )
        );
        return;
      }

      runIf(
        permissionChecker,
        callback => {
          metasync.each(
            [{ id: obj.Id }, { record: obj }],
            (opt, callback) => {
              permissionChecker(category, opt, callback);
            },
            callback
          );
        },
        err => {
          if (err) {
            callback(err);
            return;
          }

          this.pool.connect((err, client, done) => {
            if (err) {
              this.systemLogger(err);
              callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
              return;
            }
            metasync.sequential(
              [
                cb => {
                  client.query('BEGIN', err => {
                    cb(err);
                  });
                },
                (ctx, cb) => {
                  metasync.series(
                    extractIncludeCategoriesData(categoryDefinition, obj),
                    (data, cb) => {
                      updateRecord(data.category, data.value, client, err => {
                        cb(err);
                      });
                    },
                    err => {
                      cb(err);
                    }
                  );
                },
                (ctx, cb) => {
                  updateRecord(category, obj, client, err => {
                    cb(err);
                  });
                },
              ],
              (err, ctx) => {
                if (err) {
                  client.query('ROLLBACK', rollbackError => {
                    if (rollbackError) {
                      this.systemLogger(rollbackError);
                      callback(
                        new GSError(
                          errorCodes.INTERNAL_PROVIDER_ERROR,
                          rollbackError
                        )
                      );
                    } else {
                      this.systemLogger(err);
                      callback(
                        new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err)
                      );
                    }
                    done();
                  });
                  return;
                }

                client.query('COMMIT', err => {
                  if (err) {
                    this.systemLogger(err);
                    callback(
                      new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err)
                    );
                  } else {
                    callback(null, ctx.id);
                  }
                  done();
                });
              }
            );
          });
        }
      );
    });
  }

  // Create object in GlobalStorage
  //   category - <string>, category to store the object in
  //   obj - <Object>, to be stored
  //   callback - <Function>
  //     err - <Error> | <null>
  //     id - <string>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  create(category, obj, callback, permissionChecker) {
    let error;
    [error, obj] = this.schema.createAndValidate('category', category, obj);
    if (error) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.INVALID_SCHEMA,
          `Invalid schema provided: ${error}`
        )
      );
      return;
    }

    const categorySchema = this.schema.categories.get(category);
    const categoryDefinition = categorySchema.definition;
    if (isIgnoredCategory(categoryDefinition)) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.INVALID_CATEGORY_TYPE,
          `Record creation in ignored category: ${category}`
        )
      );
      return;
    }
    if (categorySchema.references.Include.length !== 0) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.INVALID_CREATION_OPERATION,
          `Cannot create instances of category ${category} individually, it is ` +
            'included in categories ' +
            categorySchema.references.Include.join(', ')
        )
      );
      return;
    }

    const createRecord = (category, obj, client, id, done) => {
      const categoryDefinition = this.schema.categories.get(category)
        .definition;
      let fields = Object.keys(obj).filter(key => {
        if (key === 'Id') return false;
        const decorator = extractDecorator(categoryDefinition[key]);
        return decorator !== 'Include' && decorator !== 'Many';
      });
      const values = fields.map(key => obj[key]);
      if (id) {
        fields.push('Id');
        values.push(id.toString());
      }
      fields = fields.map(escapeIdentifier);
      const createQuery =
        `INSERT INTO ${escapeIdentifier(category)} ` +
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

    runIfFn(permissionChecker, category, { record: obj }, err => {
      if (err) {
        callback(err);
        return;
      }
      if (isGlobalCategory(categoryDefinition)) {
        this.pool.connect((err, client, done) => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
            return;
          }
          metasync.sequential(
            [
              cb => {
                client.query('BEGIN', err => {
                  cb(err);
                });
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
                    createRecord(
                      data.category,
                      data.value,
                      client,
                      ctx.id,
                      err => {
                        cb(err);
                      }
                    );
                  },
                  err => {
                    cb(err);
                  }
                );
              },
              (ctx, cb) => {
                createRecord(category, obj, client, ctx.id, err => {
                  cb(err);
                });
              },
              (ctx, cb) => {
                client.query(
                  'UPDATE "Identifier"' +
                    ' SET "Status" = \'Actual\', "Change" = CURRENT_TIMESTAMP,' +
                    ' "Category" = (SELECT "Id" FROM "Category" WHERE "Name" = $1),' +
                    ' "Checksum" = (SELECT get_checksum($1, $2, \'sha512\'))' +
                    ' WHERE "Id" = $2',
                  [category, ctx.id],
                  err => {
                    cb(err);
                  }
                );
              },
            ],
            (err, ctx) => {
              if (err) {
                client.query('ROLLBACK', rollbackError => {
                  if (rollbackError) {
                    this.systemLogger(rollbackError);
                    callback(
                      new GSError(
                        errorCodes.INTERNAL_PROVIDER_ERROR,
                        rollbackError
                      )
                    );
                  } else {
                    this.systemLogger(err);
                    callback(
                      new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err)
                    );
                  }
                  done();
                });
                return;
              }

              client.query('COMMIT', err => {
                if (err) {
                  this.systemLogger(err);
                  callback(
                    new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err)
                  );
                } else {
                  callback(null, ctx.id);
                }
                done();
              });
            }
          );
        });
      } else {
        createRecord(category, obj, this.pool, null, (err, res) => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
          } else {
            callback(null, res);
          }
        });
      }
    });
  }

  // Update object in GlobalStorage
  //   category - <string>, category to update the records in
  //   query - <Object>, example: { Id }
  //   patch - <Object>, fields to update
  //   callback - <Function>
  //     err - <Error> | <null>
  //     count - <number>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  update(category, query, patch, callback, permissionChecker) {
    let error;
    [error, patch] = this.schema.createAndValidate(
      'category',
      category,
      patch,
      {
        patch: true,
      }
    );
    if (error) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.INVALID_SCHEMA,
          `Invalid schema provided: ${error}`
        )
      );
      return;
    }

    runIf(
      permissionChecker,
      callback => {
        metasync.each(
          [{ record: query, isQuery: true }, { record: patch, isPatch: true }],
          (opts, callback) => {
            permissionChecker(category, opts, callback);
          },
          err => {
            callback(err);
          }
        );
      },
      err => {
        if (err) {
          callback(err);
          return;
        }

        let fields = Object.keys(patch);
        const values = fields.map(key => patch[key]);
        fields = fields.map(escapeIdentifier);
        const [where, whereParams] = buildWhere(query);
        const updateQuery =
          `UPDATE ${escapeIdentifier(category)} SET ` +
          `(${fields.join(', ')}) = ` +
          `ROW (${generateQueryParams(
            fields.length,
            whereParams.length + 1
          )})` +
          where;
        this.pool.query(updateQuery, whereParams.concat(values), (err, res) => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
          } else {
            callback(null, res.rowCount);
          }
        });
      }
    );
  }

  // Delete object in GlobalStorage
  //   category - <string>, category to delete the records from
  //   query - <Object>, example: { Id }
  //   callback - <Function>
  //     err - <Error> | <null>
  //     count - <number>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  delete(category, query, callback, permissionChecker) {
    const categorySchema = this.schema.categories.get(category);
    const categoryDefinition = categorySchema.definition;
    if (categorySchema.references.Include.length !== 0) {
      process.nextTick(
        callback,
        new GSError(
          errorCodes.INVALID_DELETION_OPERATION,
          `Cannot delete instances of category ${category}, it is included` +
            ` in categories ${categorySchema.references.Include.join(', ')}`
        )
      );
      return;
    }
    runIfFn(
      permissionChecker,
      category,
      { record: query, isQuery: true },
      err => {
        if (err) {
          callback(err);
          return;
        }

        const includedCategories = extractIncludeCategories(categoryDefinition);
        const [deleteQuery, queryParams] = generateDeleteQuery(
          category,
          includedCategories,
          query
        );
        this.pool.query(deleteQuery, queryParams, (err, res) => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
          } else {
            callback(null, res.rowCount);
          }
        });
      }
    );
  }

  // Link records with Many relation between them
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  //   callback - <Function>
  //     err - <Error> | <null>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  linkDetails(category, field, fromId, toIds, callback, permissionChecker) {
    const categorySchema = this.schema.categories.get(category);
    const categoryDefinition = categorySchema.definition;
    const toCategory = categorySchema.definition[field].category;
    const tableName = manyToManyTableName(
      category,
      categoryDefinition[field].category,
      field
    );
    if (!Array.isArray(toIds)) {
      toIds = [toIds];
    }
    runIf(
      permissionChecker,
      callback => {
        metasync.each(
          [
            [category, { id: fromId }],
            ...toIds.map(id => [toCategory, { id, accessType: 'read' }]),
          ],
          (args, callback) => {
            permissionChecker(...args, callback);
          },
          err => {
            callback(err);
          }
        );
      },
      err => {
        if (err) {
          callback(err);
          return;
        }
        // TODO: add support for linking the records placed on different servers
        const query =
          `INSERT INTO ${escapeIdentifier(tableName)}` +
          ` VALUES ${generateLinkQueryParams(toIds.length)}`;
        this.pool.query(query, [fromId, ...toIds], err => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
          } else {
            callback();
          }
        });
      }
    );
  }

  // Unlink records with Many relation between them
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  //   callback - <Function>
  //     err - <Error> | <null>
  //   permissionChecker - <Function>, optional
  //     category - <string>
  //     options - <Object>
  //     callback - <Function>
  //       err - <Error> | <null>
  unlinkDetails(category, field, fromId, toIds, callback, permissionChecker) {
    const categorySchema = this.schema.categories.get(category);
    const toCategory = categorySchema.definition[field].category;
    const tableName = manyToManyTableName(category, toCategory, field);
    if (!Array.isArray(toIds)) {
      toIds = [toIds];
    }
    runIf(
      permissionChecker,
      callback => {
        metasync.each(
          [
            [category, { id: fromId }],
            ...toIds.map(id => [toCategory, { id, accessType: 'read' }]),
          ],
          (args, callback) => {
            permissionChecker(...args, callback);
          },
          err => {
            callback(err);
          }
        );
      },
      err => {
        if (err) {
          callback(err);
          return;
        }
        // TODO: add support for unlinking the records placed on different servers
        const query =
          `DELETE FROM ${escapeIdentifier(tableName)}` +
          ` WHERE ${escapeIdentifier(category)} = $1 AND` +
          ` ${escapeIdentifier(field)} = ANY ($2)`;
        this.pool.query(query, [fromId, toIds], err => {
          if (err) {
            this.systemLogger(err);
            callback(new GSError(errorCodes.INTERNAL_PROVIDER_ERROR, err));
          } else {
            callback();
          }
        });
      }
    );
  }

  // Select objects from GlobalStorage
  //   category - <string>, category to select the records from
  //   query - <Object>, fields conditions
  //
  // Returns: <Cursor>
  select(category, query) {
    return new PostgresCursor(this, { category }).select(query);
  }
}

module.exports = {
  PostgresProvider,
};
