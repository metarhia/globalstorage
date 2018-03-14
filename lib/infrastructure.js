'use strict';

const buildIndex = (
  // Build index array from tree
  tree
) => {
  const result = [];
  const parseTree = (index, depth, node) => {
    const isBranch = !!node[0];
    if (isBranch) {
      parseTree(index, depth + 1, node[0]);
      parseTree(index + (1 << depth), depth + 1, node[1]);
    } else {
      result[index] = node;
    }
  };
  parseTree(0, 0, tree);

  const height = Math.ceil(Math.log(result.length) / Math.log(2));
  let i, j, depth;
  for (i = result.length; i >= 0; i--) {
    depth = Math.ceil(Math.log(i + 1) / Math.log(2));
    for (j = 1; result[i] && j < 1 << height - depth; j++) {
      if (!result[i + (j << depth)]) {
        result[i + (j << depth)] = result[i];
      }
    }
  }
  return result;
};

module.exports = {
  buildIndex
};
