'use strict';

const jstp = require('@metarhia/jstp');

const { StorageProvider } = require('./provider');
const { RemoteCursor } = require('./remote.cursor');

const asyncCallMethod = async (conn, ...args) =>
  new Promise((resolve, reject) => {
    conn.callMethod(...args, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });

class RemoteProvider extends StorageProvider {
  constructor(options = {}) {
    super(options);
    this.connection = null;
  }

  // Open RemoteProvider
  //   options <Object> options for jstp connection
  //     transport <string> jstp transport name
  //     connectionArgs <Array> arguments to be passed to corresponding
  //         transport's connect method
  // Returns: <Promise>
  async open(options) {
    await super.open(options);
    return new Promise((resolve, reject) => {
      jstp[options.transport].connect(
        ...options.connectionArgs,
        (error, connection) => {
          if (error) {
            reject(error);
            return;
          }
          this.connection = connection;
          this.active = true;
          resolve(this);
        }
      );
    });
  }

  // Close RemoteProvider
  // Returns: <Promise>
  async close() {
    if (!this.connection) {
      return Promise.resolve();
    }
    const p = new Promise(resolve => {
      this.connection.once('close', () => {
        this.active = false;
        resolve();
      });
    });
    this.connection.close();
    this.connection = null;
    return p;
  }

  // Get record from GlobalStorage
  //   id <string> globally unique record id
  // Returns: <Promise>
  async get(id) {
    return asyncCallMethod(this.connection, 'provider', 'get', [id]);
  }

  // Get details for many-to-many link from GlobalStorage
  //   category - <string>, category to get details in
  //   id - <string>, object id
  //   fieldName - <string>, field with the Many decorator
  // Returns: <Promise>
  async getDetails(category, id, fieldName) {
    return asyncCallMethod(this.connection, 'provider', 'getDetails', [
      category,
      id,
      fieldName,
    ]);
  }

  // Set record in GlobalStorage
  //   record <Object> record to be stored
  // Returns: <Promise>
  async set(record) {
    if (!record.Id) {
      throw new TypeError('Id is not provided');
    }
    return asyncCallMethod(this.connection, 'provider', 'set', [record]);
  }

  // Create record in GlobalStorage
  //   category <string> category of record
  //   record <Object> record to be stored
  // Returns: <Promise>
  async create(category, record) {
    return asyncCallMethod(this.connection, 'provider', 'create', [
      category,
      record,
    ]);
  }

  // Update record in GlobalStorage
  //   category <string> category of record
  //   query <Object> record, example: `{ Id }`
  //   patch <Object> record, fields to update
  // Returns: <Promise>
  async update(category, query, patch) {
    return asyncCallMethod(this.connection, 'provider', 'update', [
      category,
      query,
      patch,
    ]);
  }

  // Delete record in GlobalStorage
  //   category <string> category of record
  //   query <Object> record, example: `{ Id }`
  // Returns: <Promise>
  async delete(category, query) {
    return asyncCallMethod(this.connection, 'provider', 'delete', [
      category,
      query,
    ]);
  }

  // Unlink records with Many relation between them
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  // Returns: <Promise>
  async unlinkDetails(category, field, fromId, toIds) {
    return asyncCallMethod(this.connection, 'provider', 'unlinkDetails', [
      category,
      field,
      fromId,
      toIds,
    ]);
  }

  // Link records with Many relation between them
  //   category - <string>, category with field having the Many decorator
  //   field - <string>, field with the Many decorator
  //   fromId - <Uint64>, Id of the record in category specified in the first
  //       argument
  //   toIds - <Uint64> | <Uint64[]>, Id(s) of the record(s) in category
  //       specified in the Many decorator of the specified field
  // Returns: <Promise>
  async linkDetails(category, field, fromId, toIds) {
    return asyncCallMethod(this.connection, 'provider', 'linkDetails', [
      category,
      field,
      fromId,
      toIds,
    ]);
  }

  // Select record from GlobalStorage
  //   category <string> category of record
  //   query <Object> fields conditions
  // Returns: <Cursor> cursor
  select(category, query) {
    return new RemoteCursor(this.connection, { category }).select(query);
  }

  // Execute an action
  //   category <string> | <null> category name or null to execute public action
  //   action <string> action name
  //   actionArgs <Object>
  //     context <Object>
  //     args <Object>
  // Returns: <Promise>
  async execute(category, action, actionArgs) {
    return asyncCallMethod(this.connection, 'provider', 'execute', [
      category,
      action,
      actionArgs,
    ]);
  }

  async getSchemaSources() {
    return asyncCallMethod(this.connection, 'provider', 'getSchemaSources', []);
  }

  async listCategories() {
    return asyncCallMethod(this.connection, 'provider', 'listCategories', []);
  }

  // List categories permission flags
  // Returns: <Promise>
  async listCategoriesPermissions() {
    return asyncCallMethod(
      this.connection,
      'provider',
      'listCategoriesPermissions',
      []
    );
  }

  async listActions() {
    return asyncCallMethod(this.connection, 'provider', 'listActions', []);
  }

  async listApplications() {
    return asyncCallMethod(this.connection, 'provider', 'listApplications', []);
  }

  async getCategoryL10n(langTag, category) {
    return asyncCallMethod(this.connection, 'l10n', 'getCategory', [
      langTag,
      category,
    ]);
  }

  async getDomainsL10n(langTag) {
    return asyncCallMethod(this.connection, 'l10n', 'getDomains', [langTag]);
  }

  async getCommonL10n(langTag) {
    return asyncCallMethod(this.connection, 'l10n', 'getCommon', [langTag]);
  }

  async getFormL10n(langTag, category, form) {
    return asyncCallMethod(this.connection, 'l10n', 'getForm', [
      langTag,
      category,
      form,
    ]);
  }

  async getActionL10n(langTag, category, action) {
    return asyncCallMethod(this.connection, 'l10n', 'getAction', [
      langTag,
      category,
      action,
    ]);
  }
}

module.exports = { RemoteProvider };
