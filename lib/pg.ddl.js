'use strict';

const { iter } = require('metarhia-common');

const {
  escapeString,
  escapeIdentifier,
  validateIdentifier,
  PREDEFINED_DOMAINS,
  IGNORED_DOMAINS,
} = require('./pg.utils');

const { getCategoryType } = require('./schema.utils');

const NO_FOREIGN_KEY = ['Registry', 'History'];

const pad =
  (name, length, symbol = ' ') => name + symbol.repeat(length - name.length);

const padProperty = (name, length) => pad(`"${name}"`, length + 2);

const verticalPad = text => (text ? `\n\n${text}` : '');

const createComment = string => {
  const separator = `-- ${string} `;
  return '\n' + pad(separator, 80, '-') + '\n\n';
};

// Generates SQL to define an Enum
//   domainName - string
//   values - array, array of values of an Enum
// Returns: string
const createEnum = (domainName, values) => {
  const type = domainName;
  validateIdentifier(type, 'enum');

  const sql =
    createComment(`Enum: ${type}`) +
    `CREATE TYPE ${escapeIdentifier(domainName)} AS ENUM (\n` +
    `  ${values.map(escapeString).join(',\n  ')}\n);`;
  return { type, sql };
};

const typeFromDomain = {
  number: domain => (domain.floating ? 'double precision' : 'bigint'),
  string: () => 'text',
  function: () => 'text',
  boolean: () => 'boolean',
};

// Generates SQL to define a domain
//   domainName - string
//   domain - object
// Returns: string
const generateType = (domainName, domain) => {
  const domainType = domain.constructor.name;
  if (domainType === 'Object') {
    const predefinedType = PREDEFINED_DOMAINS[domainName];
    const type = predefinedType || typeFromDomain[domain.type](domain);
    return { type };
  }
  if (domainType === 'Enum') {
    return createEnum(domainName, domain.values);
  }
  if (domainType === 'Flags') {
    if (domain.values.length <= 16) {
      return { type: 'smallint' };
    }
    if (domain.values.length <= 32) {
      return { type: 'integer' };
    }
    if (domain.values.length <= 64) {
      return { type: 'bigint' };
    }
    throw new Error(
      `Too many flags in ${domainName}, must not be bigger than 64`
    );
  }
  throw new Error(`Unsupported domain: ${domainName}`);
};

// Generates Map of domain name to SQL definition of that domain
//   domains - Map, Map of domain definitions
// Returns: Map, domain -> SQL type definition
const generateTypes = domains => {
  const sqlQueries = [];
  const types = iter(domains)
    .filter(([domainName]) => !IGNORED_DOMAINS.includes(domainName))
    .map(([domainName, domain]) => {
      const { type, sql } = generateType(domainName, domain);
      if (sql) {
        sqlQueries.push(sql);
      }
      return [domainName, type];
    })
    .collectTo(Map);
  return { types, typesSQL: sqlQueries.join('\n') };
};

// Determines if a property should have a FOREIGN KEY constraint
//   categories - object, object that contains categories by their name
//   link - object, property that requires a link
//   from - string, name of a source category
//   to - string, name of a destination category
// Returns: boolean
const requiresForeignKey = (categories, link, from, to) => {
  const destination = categories[from].constructor.name;
  const source = categories[to].constructor.name;

  return !NO_FOREIGN_KEY.includes(destination) ||
    !NO_FOREIGN_KEY.includes(source);
};

// Categorizes schema entries into indexes, unique, links, and properties
//   category - object, category definition
//   categoryName - string, name of a category
//   categories - object, object that contains categories
//                with their names as keys
// Returns: {
//   indexes - array, array of { name, property }
//   unique - array, array of { name, property }
//   links - array, array of { name, property, required }
//   properties - array, array of { name, property }
// }
const categorizeEntries = (category, categoryName, categories) => {
  const indexes = [];
  const unique = [];
  const links = [];
  const properties = [];
  iter(Object.keys(category))
    .filter(name => typeof category[name] !== 'function')
    .each(name => {
      validateIdentifier(name, 'entry', `${categoryName}.`);

      const property = category[name];
      const type = property.constructor.name;
      const entry = { name, property };
      if (property.index) {
        indexes.push(entry);
      } else if (property.unique) {
        unique.push(entry);
      }
      if (property.domain) {
        properties.push(entry);
      } else if (property.category) {
        entry.foreignKey = requiresForeignKey(
          categories,
          property,
          categoryName,
          property.category
        );

        if (type !== 'Many') {
          if (type !== 'Object') {
            entry.property.required = type === 'Master' || type === 'Include';
          }

          properties.push(entry);
        }

        if (type === 'Many' || entry.foreignKey) {
          links.push(entry);
        }
      } else if (type === 'Index') {
        indexes.push(entry);
      } else if (type === 'Unique') {
        unique.push(entry);
      }
    });

  return { indexes, unique, links, properties };
};

// Calculates max length of properties in a category
//   properties - array, array of { name, property }
// Returns: number
const getMaxPropLength =
  properties => iter(properties)
    .map(property => property.name.length)
    .reduce(Math.max);

// Generates SQL to define properties in a table
//   category - string, category name
//   properties - array, array of properties in a category
//   types - Map, domain -> SQL type definition
//   maxPropLength - number, length of properties to be padded to
// Returns: string
const generateProperties =
  (category, properties, types, maxPropLength) => properties.map(
    ({ name, property }) => {
      const type = property.domain ? types.get(property.domain) : 'bigint';
      if (!type) {
        throw new Error(
          `Domain ${property.domain} referenced from ${category}.${name} ` +
          'is not defined'
        );
      }
      let sql = `${padProperty(name, maxPropLength)} ${type}`;
      if (property.required) {
        sql += ' NOT NULL';
      }
      if (property.default !== undefined) {
        sql += ` DEFAULT ${escapeString(property.default.toString())}`;
      }
      return sql;
    }
  );

// Generates SQL to define a link in a table
//   from - string, name of a source category
//   to - string, name of a destination category
//   name - string, name of a link
//   type - string, type of link
//   link - object
// Returns: string
const generateLink = (from, to, name, type, link) => {
  const constraint = `fk${from}${name}`;
  validateIdentifier(constraint, 'constraint');
  let sql =
    `ALTER TABLE ${escapeIdentifier(from)} ` +
    `ADD CONSTRAINT ${escapeIdentifier(constraint)} ` +
    `FOREIGN KEY (${escapeIdentifier(name)}) `;

  sql += `REFERENCES "${link.category}" (${escapeIdentifier('Id')}) ` +
    'ON UPDATE RESTRICT ON DELETE ';

  if (type === 'Object') {
    sql += (link.required ? 'RESTRICT' : 'SET NULL');
  } else if (type === 'Master') {
    sql += 'CASCADE';
  } else {
    throw new Error(`${type} decorator is not supported`);
  }

  return sql + ';';
};

// Generates SQL to define many to many relationship
//   from - string, name of a source category
//   to - string, name of a destination category
//   name - string, name of a link
//   type - string, type of link
//   link - object
//   categories - object, object that contains categories by their name
// Returns: string
const generateManyToMany = (from, to, name, link, categories) => {
  const propLength = from.length > to.length ? from.length : to.length;
  const table =
    `\nCREATE TABLE ${escapeIdentifier(from + name)} (\n` +
    `  ${padProperty(from, propLength)} bigint NOT NULL,\n` +
    `  ${padProperty(to, propLength)} bigint NOT NULL\n);`;

  const lines = [table];

  if (requiresForeignKey(categories, link, from, to)) {
    lines.push(generateLink(name, from, from, 'Master', { category: to }));
    lines.push(generateLink(name, to, to, 'Master', { category: from }));
  }

  const primary = `pk${name}${from}${to}`;
  validateIdentifier(primary, 'constraint');

  lines.push(
    `ALTER TABLE ${escapeIdentifier(name)} ` +
    `ADD CONSTRAINT ${escapeIdentifier(primary)} ` +
    `PRIMARY KEY (${escapeIdentifier(from)}, ${escapeIdentifier(to)});`
  );
  return lines.join('\n');
};

// Generates SQL to define links in a table
//   links - array, array of links
//   categories - object, object that contains categories by their name
// Returns: string
const generateLinks = (links, categories) => links
  .sort(({ link }) => link.constructor.name === 'Many')
  .map(({ from, to, name, link }) => {
    const type = link.constructor.name;
    return type === 'Many' ?
      generateManyToMany(from, to, name, link, categories) :
      generateLink(from, to, name, type, link);
  })
  .join('\n');

// Generates SQL to define indexes in a table
//   indexes - array, array of entries that require an index
//   table - string, name of a table
// Returns: string
const generateIndexes = (indexes, table) => indexes
  .map(({ name, property: index }) => {
    const type = index.constructor.name;
    const prop = type === 'Index' ?
      index.fields.map(escapeIdentifier).join(', ') :
      escapeIdentifier(name);

    const indexName = `idx${table}${name}`;
    validateIdentifier(name, 'index');

    return `CREATE INDEX ${escapeIdentifier(indexName)} ` +
      `on ${escapeIdentifier(table)} (${prop});`;
  })
  .join('\n');

// Generates SQL to define UNIQUE constraints in a table
//   unique - array, array of entries that require UNIQUE constraint
//   table - string, name of a table
// Returns: string
const generateUnique = (unique, table) => unique
  .map(({ name, property: index }) => {
    const type = index.constructor.name;
    const prop = type === 'Unique' ?
      index.fields.map(escapeIdentifier).join(', ') :
      escapeIdentifier(name);

    const constraint = `ak${table}${name}`;
    validateIdentifier(constraint, 'constraint');

    return (
      `ALTER TABLE ${escapeIdentifier(table)} ` +
      `ADD CONSTRAINT ${escapeIdentifier(constraint)} UNIQUE (${prop});`
    );
  })
  .join('\n');

// Generates SQL to define id in a table
//   type - string, type of a category
//   length - length to pad id to
// Returns: string
const generateId = (type, length) => padProperty('Id', length) +
  (type === 'Global' ? ' bigint' : ' bigserial');

// Categorizes links into resolvable and unresolvable.
//   category - string, name of category to resolve links to and from
//   unresolvedLinks - Map, Map of unresolved links
//   links - array, array of links to be categorized
//   existingTables - array, array of names of defined tables
// Returns: [
//   unresolved - array, array of links that can not be resolved at he moment
//   resolvableLinks - array, array of links that can be resolved
// ]
const getResolvableLinks = (
  category,
  unresolvedLinks,
  links,
  existingTables
) => {
  const resolvableLinks = unresolvedLinks.get(category) || [];
  const unresolved = links.filter(({ name, property: link }) => {
    if (link.category === category || existingTables.includes(link.category)) {
      resolvableLinks.push({
        from: category,
        to: link.category,
        name,
        link,
      });
      return false;
    }
    return true;
  });

  return [unresolved, resolvableLinks];
};

// Generates SQL to define a table.
//   name - string, name of a category
//   category - object, category definition
//   type - string, type of a category
//   types - Map, domain -> SQL type definition
//   unresolvedLinks - Map, Map of unresolved links
//   existingTables - array, array of names of defined tables
//   categories - object, object that contains categories by their name
// Returns: string
const generateTable = (
  name,
  category,
  type,
  types,
  unresolvedLinks,
  existingTables,
  categories
) => {
  validateIdentifier(name, 'table');

  const {
    indexes,
    unique,
    links,
    properties,
  } = categorizeEntries(category, name, categories);

  const maxPropLength = getMaxPropLength(properties);
  const props = generateProperties(name, properties, types, maxPropLength);
  props.unshift(generateId(type, maxPropLength));

  const [unresolved, resolvableLinks] =
    getResolvableLinks(name, unresolvedLinks, links, existingTables);

  const pk = `pk${name}Id`;
  validateIdentifier(pk, 'constraint');

  const primaryKey =
    `ALTER TABLE ${escapeIdentifier(name)} ` +
    `ADD CONSTRAINT ${escapeIdentifier(pk)} ` +
    `PRIMARY KEY (${escapeIdentifier('Id')});`;

  const sql =
    createComment(`Category: ${name}`) +
    `CREATE TABLE ${escapeIdentifier(name)} (\n  ${props.join(',\n  ')}\n);` +
    [
      generateIndexes(indexes, name),
      generateUnique(unique, name),
      primaryKey,
      generateLinks(resolvableLinks, categories),
    ].map(verticalPad).join('');

  return {
    sql,
    unresolved,
  };
};

// Adds new unresolved links to an existing map
//   links - array, array of { name, property, required }
//   unresolvedLinks - Map, Map of unresolved links: destination
//   category - string, category name
const addUnresolved = (links, unresolved, category) => {
  links.forEach(({ name, property: link }) => {
    const existingLinks = unresolved.get(link.category);
    const newLink = {
      from: category,
      to: link.category,
      name,
      link,
    };
    if (existingLinks) {
      existingLinks.push(newLink);
    } else {
      unresolved.set(link.category, [newLink]);
    }
  });
};

// Generates SQL to define tables based on a schema.
//   schema - object, data schema generated by metaschema
//   types - Map, domain -> SQL type definition
// Returns: string
const generateTables = (schema, types) => {
  const unresolvedLinks = new Map(); /* links: table => [{ name, link }] */
  const existingTables = [];
  return iter(Object.keys(schema))
    .map(name => {
      const category = schema[name];
      const type = getCategoryType(category.constructor.name);
      return {
        name,
        category,
        type,
      };
    })
    .filter(({ type }) => type !== 'Ignore')
    .map(({ name, category, type }) => {
      const { sql, unresolved } = generateTable(
        name,
        category,
        type,
        types,
        unresolvedLinks,
        existingTables,
        schema
      );
      if (unresolved) {
        addUnresolved(unresolved, unresolvedLinks, name);
      }
      existingTables.push(name);
      return sql;
    })
    .toArray()
    .join('\n');
};

// Generates SQL to define a postgres database structure based on a schema.
//   schema - object, data schema generated by metaschema
//   domain - Map, Map of domain definitions
// Returns: string
const generateDDL = (schema, domains) => {
  const { types, typesSQL } = generateTypes(domains);
  const tablesSQL = generateTables(schema, types);

  return typesSQL + '\n' + tablesSQL;
};

module.exports = { generateDDL };
