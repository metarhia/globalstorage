'use strict';

function Test(name) {
  this.name = name;
}

Test.prototype.end = () => {};

const formatErr = (v1, v2) => 'strictSame:\n' +
        'actual: ' + JSON.stringify(v1) + '\n' +
        'expected: ' + JSON.stringify(v2) + '\n';

const equal = (v1, v2) => {
  if (typeof(v1) !== 'object' || !v1 || !v2) return v1 === v2;
  const k1 = new Set(Object.keys(v1));
  const k2 = Object.keys(v2);
  if (k1.size !== k2.length) return false;
  for (const key of k2) {
    if (!k1.has(key) || !equal(v1[key], v2[key])) {
      return false;
    }
  }
  return true;
};

Test.prototype.strictSame = function(v1, v2) {
  if (equal(v1, v2)) return;
  const errStr = formatErr(v1, v2);
  console.dir(new Error(this.name + ': ' + errStr));
};

module.exports = {
  test(name, fn) {
    const t = new Test(name);
    fn(t);
  },
};
