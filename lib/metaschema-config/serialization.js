'use strict';

const { parse, parseExpression } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

const buildPath = (node, path = []) => {
  if (node) {
    if (node.node.key) {
      path.push(node.node.key.name);
    }
    buildPath(node.parentPath, path);
  }

  return path;
};

const getInstance = (path, ins) =>
  ins && path.length ? getInstance(path, ins[path.shift()]) : ins;

const serializeSchema = (
  schema,
  { exclude = () => null, replace = () => null } = {}
) => {
  const { source, ...result } = schema;
  const ast = parse(`(${source})`);

  traverse(ast, {
    ObjectProperty(path) {
      const pathToNode = buildPath(path).reverse();

      const options = {
        path: pathToNode,
        key: path.node.key.name,
        node: path.node,
        source: generate(path.node.value).code,
        ins: getInstance(pathToNode, schema.definition),
      };

      if (exclude(options)) {
        path.remove();
      } else {
        const replaceStr = replace(options);
        if (replaceStr) {
          path.node.value = parseExpression(replaceStr);
        }
      }
    },
  });

  result.definition = null;
  result.source = generate(ast).code;
  return result;
};

module.exports = { serializeSchema };
