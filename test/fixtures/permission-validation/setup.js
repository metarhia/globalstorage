'use strict';

const { isIP } = require('net');
const { join } = require('path');
const { Uint64, iter } = require('@metarhia/common');
const jstp = require('@metarhia/jstp');
const metaschema = require('metaschema');

const rootDir = '../../../';

const gs = require(rootDir);
const { pgOptions } = require('../../utils');
const { options, config } = require(rootDir + 'lib/metaschema-config/config');

const pgProvider = gs('pg', {});

const subsystemNames = ['S1', 'S2'];
const rawSubsystems = [
  { Name: 'S1', Parent: null, Code: 0 },
  { Name: 'S2', Parent: null, Code: 1 },
];

const rawCatalogs = [
  { Caption: 'C1', Category: 'Document' },
  { Caption: 'C2', Category: 'Document' },
  { Caption: 'C3', Category: 'Document' },
];

const rawRoles = [
  { Name: 'Admin' },
  { Name: 'Guest' },
  { Name: 'ReadOnly' },
  { Name: 'InsertOnly' },
  { Name: 'UpdateOnly' },
  { Name: 'DeleteOnly' },
  { Name: 'BlockedRole', Blocked: true },
];

const rawUsers = [
  { Login: 'AdminUser', Password: 'password' },
  { Login: 'GuestUser', Password: 'password' },
  { Login: 'ReadOnlyUser', Password: 'password' },
  { Login: 'InsertOnlyUser', Password: 'password' },
  { Login: 'UpdateOnlyUser', Password: 'password' },
  { Login: 'DeleteOnlyUser', Password: 'password' },
  { Login: 'BlockedRoleUser', Password: 'password' },
];

const rawPermissions = {
  Admin: [
    { Category: 'Action', Access: new Uint64(0b11111) },
    { Category: 'Category', Access: new Uint64(0b11111) },
    { Category: 'Permission', Access: new Uint64(0b11111) },
    { Category: 'Role', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'Role', Subsystem: 'S2', Access: new Uint64(0b11111) },
    { Category: 'SystemUser', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'SystemUser', Subsystem: 'S2', Access: new Uint64(0b11111) },
    { Category: 'Person', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'Document', Catalog: 'C1', Access: new Uint64(0b11111) },
    {
      Category: 'PersonDocument',
      Subsystem: 'S1',
      Access: new Uint64(0b11111),
    },
    {
      Category: 'PersonDocument',
      Catalog: 'C1',
      Access: new Uint64(0b11111),
    },
  ],
  Guest: [],
  ReadOnly: [
    { Category: 'Category', Access: new Uint64(0b0001) },
    { Category: 'Catalog', Access: new Uint64(0b0001) },
    { Category: 'Role', Subsystem: 'S2', Access: new Uint64(0b0001) },
    { Category: 'SystemUser', Subsystem: 'S1', Access: new Uint64(0b0001) },
    { Category: 'Person', Subsystem: 'S1', Access: new Uint64(0b0001) },
    { Category: 'Document', Catalog: 'C1', Access: new Uint64(0b0001) },
    {
      Category: 'Permission',
      onlyForSubsystem: 'S1',
      Access: new Uint64(0b0001),
    },
    {
      Category: 'PersonDocument',
      Subsystem: 'S1',
      Access: new Uint64(0b0001),
    },
    {
      Category: 'PersonDocument',
      Catalog: 'C1',
      Access: new Uint64(0b0001),
    },
  ],
  InsertOnly: [
    { Category: 'Category', Access: new Uint64(0b0010) },
    { Category: 'Person', Subsystem: 'S1', Access: new Uint64(0b0010) },
    { Category: 'Document', Catalog: 'C1', Access: new Uint64(0b0010) },
    { Category: 'Catalog', onlyForSubsystem: 'S1', Access: new Uint64(0b0010) },
    {
      Category: 'PersonDocument',
      Subsystem: 'S1',
      Access: new Uint64(0b0010),
    },
    {
      Category: 'PersonDocument',
      Catalog: 'C2',
      Access: new Uint64(0b0010),
    },
  ],
  UpdateOnly: [
    { Category: 'Category', Access: new Uint64(0b0100) },
    { Category: 'Catalog', Access: new Uint64(0b0100) },
    { Category: 'Role', Subsystem: 'S1', Access: new Uint64(0b0100) },
    { Category: 'SystemUser', Subsystem: 'S1', Access: new Uint64(0b0100) },
    { Category: 'Person', Subsystem: 'S1', Access: new Uint64(0b0100) },
    { Category: 'Document', Catalog: 'C1', Access: new Uint64(0b0100) },
    {
      Category: 'Permission',
      onlyForSubsystem: 'S1',
      Access: new Uint64(0b0100),
    },
    {
      Category: 'PersonDocument',
      Subsystem: 'S2',
      Access: new Uint64(0b0100),
    },
    {
      Category: 'PersonDocument',
      Catalog: 'C2',
      Access: new Uint64(0b0100),
    },
  ],
  DeleteOnly: [
    { Category: 'Category', Access: new Uint64(0b1000) },
    { Category: 'Catalog', Access: new Uint64(0b1000) },
    { Category: 'Person', Subsystem: 'S1', Access: new Uint64(0b1000) },
    { Category: 'Document', Catalog: 'C1', Access: new Uint64(0b1000) },
    {
      Category: 'PersonDocument',
      Subsystem: 'S2',
      Access: new Uint64(0b1000),
    },
    {
      Category: 'PersonDocument',
      Catalog: 'C1',
      Access: new Uint64(0b1000),
    },
  ],
  BlockedRole: [
    { Category: 'Catalog', Access: new Uint64(0b11111) },
    { Category: 'Category', Access: new Uint64(0b11111) },
    { Category: 'Role', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'Role', Subsystem: 'S2', Access: new Uint64(0b11111) },
    { Category: 'SystemUser', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'SystemUser', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'Person', Subsystem: 'S1', Access: new Uint64(0b11111) },
    { Category: 'Document', Catalog: 'C1', Access: new Uint64(0b11111) },
  ],
};

const rawData = {
  Document: [
    { Name: 'documentC1', Catalog: 'C1' },
    { Name: 'document2C1', Catalog: 'C1' },
    { Name: 'documentC2', Catalog: 'C2' },
  ],
  Person: [
    { Name: 'personS1', Subsystem: 'S1' },
    { Name: 'person2S1', Subsystem: 'S1' },
    { Name: 'personS2', Subsystem: 'S2' },
  ],
  PersonDocument: [
    { Name: 'personDocumentC1S1', Catalog: 'C1', Subsystem: 'S1' },
    { Name: 'personDocumentC1S2', Catalog: 'C1', Subsystem: 'S2' },
    { Name: 'personDocumentC2S2', Catalog: 'C2', Subsystem: 'S2' },
  ],
};

const preparePgProvider = async () => {
  const systemSchemasDir = join(__dirname, '../../..', 'schemas', 'system');
  const testSchemasDir = join(__dirname, 'schemas');
  const context = {
    api: { common: { Uint64 }, net: { isIP } },
    Auth: { passwordStrength: password => password.length > 5 },
  };
  const schema = await metaschema.fs.load(
    [systemSchemasDir, testSchemasDir],
    { ...options, context },
    config
  );
  const providerOptions = {
    ...pgOptions,
    schema,
    database: 'test_permission_validation',
  };

  await pgProvider.open(providerOptions);
  await pgProvider.setup();
};

const prepareSubsystems = async () => {
  const subsystems = {};

  await Promise.all(
    rawSubsystems.map(async subsystem => {
      subsystems[subsystem.Name] = await pgProvider.create(
        'Subsystem',
        subsystem
      );
    })
  );

  return subsystems;
};

const prepareRoles = async subsystems => {
  const roles = {};
  const createSubsystemRoles = subsystem => {
    const subsystemRoles = {};
    roles[subsystem] = subsystemRoles;

    return rawRoles.map(async role => {
      const { Name: name } = role;
      role = {
        ...role,
        Name: name + subsystem,
        Subsystem: subsystems[subsystem],
      };
      subsystemRoles[name] = await pgProvider.create('Role', role);
    });
  };

  await Promise.all(iter(subsystemNames).flatMap(createSubsystemRoles));
  return roles;
};

const prepareUsers = async subsystems => {
  const users = {};
  const createSubsystemUsers = subsystem => {
    const subsystemUsers = {};
    users[subsystem] = subsystemUsers;

    return rawUsers.map(async user => {
      const { Login: login } = user;
      user = {
        ...user,
        Login: login + subsystem,
        Subsystem: subsystems[subsystem],
      };
      subsystemUsers[login] = await pgProvider.create('SystemUser', user);
    });
  };

  await Promise.all(iter(subsystemNames).flatMap(createSubsystemUsers));
  return users;
};

const getEntitiesIds = async () => {
  const entities = ['Action', 'Category', 'Application'];
  return Promise.all(
    entities.map(async category => {
      const res = await pgProvider.select(category, {}).fetch();
      return res.reduce((ids, row) => {
        ids[row.Name] = row.Id;
        return ids;
      }, {});
    })
  );
};

const prepareCatalogs = async categories => {
  const catalogs = {};

  await Promise.all(
    rawCatalogs.map(async catalog => {
      catalog.Category = categories[catalog.Category];
      catalogs[catalog.Caption] = await pgProvider.create('Catalog', catalog);
    })
  );

  return catalogs;
};

const prepareTestData = async (categories, catalogs, subsystems) => {
  const data = {};
  const createGSObjects = ([category, rawObjects]) => {
    const objectIds = {};
    data[category.toLowerCase()] = objectIds;

    return rawObjects.map(async obj => {
      const name = obj.Name || obj.Caption;
      if (obj.Catalog) obj.Catalog = catalogs[obj.Catalog];
      if (obj.Category) obj.Category = categories[obj.Category];
      if (obj.Subsystem) obj.Subsystem = subsystems[obj.Subsystem];
      objectIds[name] = await pgProvider.create(category, obj);
    });
  };

  await Promise.all(iter(Object.entries(rawData)).flatMap(createGSObjects));
  return data;
};

const preparePermissions = async (subsystems, categories, catalogs, roles) => {
  const permissions = { S1: {}, S2: {} };
  const createRolePermissions = ([role, rolePermissions]) => {
    const preparedPermissions = [];

    for (const permission of rolePermissions) {
      for (const subsystem of subsystemNames) {
        if (
          (permission.Subsystem && permission.Subsystem !== subsystem) ||
          (permission.onlyForSubsystem &&
            permission.onlyForSubsystem !== subsystem)
        ) {
          continue;
        }

        const preparedPermission = {};
        const permissionName = role + permission.Category;

        if (permission.Subsystem) {
          preparedPermission.Subsystem = subsystems[subsystem];
        }
        if (permission.Catalog) {
          preparedPermission.Catalog = catalogs[permission.Catalog];
        }

        preparedPermission.Access = permission.Access;
        preparedPermission.Role = roles[subsystem][role];
        preparedPermission.Category = categories[permission.Category];

        preparedPermissions.push([
          subsystem,
          permissionName,
          preparedPermission,
        ]);
      }
    }

    return preparedPermissions.map(
      async ([subsystem, permissionName, permission]) => {
        permissions[subsystem][permissionName] = await pgProvider.create(
          'Permission',
          permission
        );
      }
    );
  };

  await Promise.all(
    iter(Object.entries(rawPermissions)).flatMap(createRolePermissions)
  );
  return permissions;
};

const linkRolesAndUsers = async (roles, users) => {
  const linkSubsystemRolesAndUsers = (roles, users) =>
    Object.keys(roles).map(async role =>
      pgProvider.linkDetails(
        'SystemUser',
        'Roles',
        users[`${role}User`],
        roles[role]
      )
    );

  await Promise.all(
    iter(subsystemNames).flatMap(subsystem =>
      linkSubsystemRolesAndUsers(roles[subsystem], users[subsystem])
    )
  );
};

const linkActionsAndPermissions = async (actions, permissions) => {
  const links = [
    [permissions.S1.AdminPerson, actions.getPersonName],
    [permissions.S1.AdminDocument, actions.getDocumentName],
    [permissions.S1.AdminPersonDocument, actions.getPersonDocumentName],
    [permissions.S1.BlockedRolePerson, actions.getPersonName],
  ];

  await Promise.all(
    links.map(async args =>
      pgProvider.linkDetails('Permission', 'Actions', ...args)
    )
  );
};

const linkApplicationsAndRoles = async (roles, applications) => {
  const links = [
    [roles.S1.Admin, applications.PersonApplication],
    [roles.S2.Admin, applications.DocumentApplication],
  ];

  await Promise.all(
    links.map(async args =>
      pgProvider.linkDetails('Role', 'Applications', ...args)
    )
  );
};

const startJstpServer = async () => {
  const user = {
    login: async (connection, userId) => {
      connection.session.set('userId', userId);
    },
  };
  const remoteProviderApi = pgProvider.createJstpApi();
  const remoteProviderApp = new jstp.Application('gs', {
    ...remoteProviderApi,
    user,
  });
  const server = jstp.net.createServer([remoteProviderApp]);

  return new Promise(resolve => server.listen(3000, () => resolve(server)));
};

const setup = async () => {
  await preparePgProvider();

  const subsystems = await prepareSubsystems();
  const roles = await prepareRoles(subsystems);
  const users = await prepareUsers(subsystems);
  const [actions, categories, applications] = await getEntitiesIds();
  const catalogs = await prepareCatalogs(categories);
  const data = await prepareTestData(categories, catalogs, subsystems);
  const permissions = await preparePermissions(
    subsystems,
    categories,
    catalogs,
    roles
  );

  await linkRolesAndUsers(roles, users);
  await linkActionsAndPermissions(actions, permissions);
  await linkApplicationsAndRoles(roles, applications);
  const server = await startJstpServer();

  return {
    data,
    roles,
    users,
    server,
    actions,
    catalogs,
    subsystems,
    categories,
    permissions,
    applications,
    provider: pgProvider,
  };
};

const prepareRemoteProvider = schema => async () => {
  const remoteProvider = gs('remote');
  const providerOptions = {
    schema,
    transport: 'net',
    connectionArgs: ['gs', null, 3000],
  };
  const login = userId =>
    new Promise(resolve =>
      remoteProvider.connection.callMethod('user', 'login', [userId], resolve)
    );

  await remoteProvider.open(providerOptions);
  return { remoteProvider, login };
};

module.exports = {
  setup,
  prepareRemoteProvider,
};
