'use strict';

// Tree implementation for server topology

// Tree has 3 states:
//   1. Empty. Empty array inside.
//   2. Leaf. One element (server id) array inside.
//   3. Node. Two elements (child trees) array inside.

// Funcs that working with Tree based on tree state (array length)
var insertFuncs, getFuncs, getWithSpecificIdFuncs, toStringFuncs;

function Tree() {}

Tree.prototype = [];

Tree.prototype.isEmpty = function() {
  return this.length === 0;
};

Tree.prototype.insert = function(id, elem) {
  insertFuncs[this.length](this, id, elem);
  return this;
};

Tree.prototype.get = function(id) {
  return getFuncs[this.length](this, id);
};

Tree.prototype.getWithSpecificId = function(id) {
  return getWithSpecificIdFuncs[this.length](this, id);
};

Tree.prototype.toString = function() {
  return toStringFuncs[this.length](this);
};

function make(arr) {
  return Object.setPrototypeOf(arr, Tree.prototype);
}

function empty() { return make([]); }

// Insert in the tree server with defined id

insertFuncs = [
  function(tree, id, server) {
    if (id === 0) {
      tree.push(server);
    } else {
      var newEmpty = empty(),
          z = id & 1;
      id >>= 1;
      var newWithServer = empty().insert(id, server);
      if (z === 0) {
        tree[0] = newWithServer;
        tree[1] = newEmpty;
      } else {
        tree[0] = newEmpty;
        tree[1] = newWithServer;
      }
    }
  },

  function(tree, id, server) {
    if (id === 0) {
      tree[0] = server;
    } else {
      var z = id & 1;
      id >>= 1;
      tree[0] = make([tree[0]]);
      tree.push(empty());
      tree[z].insert(id, server);
    }
  },

  function(tree, id, server) {
    console.log(server);
    while (tree.length === 2) {
      var z = id & 1;
      tree = tree[z];
      id >>= 1;
    }
    tree.insert(id, server);
  },
];

// Get server by id from tree. Auto detect id length.

getFuncs = [
  function() { return null; },

  function(tree) { return { val: tree[0], id: 0 }; },

  function(tree, id) {
    var resId = 0,
        st2 = 1;
    do {
      var z = id & 1;
      tree = tree[z];
      id >>= 1;
      resId += st2 * z;
      st2 <<= 1;
    } while (tree.length === 2);
    return {
      val: getFuncs[tree.length](tree, id).val,
      id: resId,
    };
  },
];

// Get server by id from tree. Argument id is specific and
// if it is wrong then function returns null

getWithSpecificIdFuncs = [
  getFuncs[0],

  function(tree, id) {
    return id === 0 ? { val: tree[0], id: 0 } : null;
  },

  function(tree, id) {
    var resId = 0,
        varId = id,
        st2 = 1;
    do {
      var z = varId & 1;
      tree = tree[z === 1 ? 1 : 0];
      varId >>= 1;
      resId += st2 * z;
      st2 <<= 1;
    } while (tree.length === 2);
    var res = getWithSpecificIdFuncs[tree.length](tree, varId);
    if (res !== null && id === resId) {
      return { val: res.val, id: resId };
    } else {
      return null;
    }
  },
];

toStringFuncs = [
  function() { return 'Empty'; },
  function(tree) { return tree[0].toString(); },
  function(tree) {
    return ['(', tree[0].toString(), ' . ',
                 tree[1].toString(), ')'].join('');
  }
];



module.exports = {
  make: make,
  empty: empty,
};
