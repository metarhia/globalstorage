'use strict';

const { parse, parseExpression } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { CodeGenerator } = require('@babel/generator');

const generate = ast => new CodeGenerator(ast).generate().code;

const serializeSchema = (
  schema,
  { exclude = () => null, replace = () => null } = {}
) => {
  const { source, ...result } = schema;
  const ast = parse(`(${source})`);

  traverse(ast, {
    ObjectProperty(path) {
      const options = {
        key: path.node.key.name,
        node: path.node,
        source: generate(path.node.value),
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
  result.source = generate(ast);
  return result;
};

module.exports = { serializeSchema };
