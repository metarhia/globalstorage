let api = require('./api')('common');

function* makeGen(func, ...args) {
  while (true) {
    yield func(...args);
  }
}

function* takeN(n, gen) {
  for (var i = 0; i < n; i++) {
    let res = gen.next();
    if (res.done) {
      return res.value;
    } else {
      yield res.value;
    }
  }
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function numberGen(min, max) {
  return makeGen(randomNumber, min, max);
}

function stringGen({ lengthGen, charGen, numGen } = {}) {
  lengthGen = api.common.withDefault(lengthGen, numberGen(1, 10));
  return makeGen(() =>  {
    return randomString({
      length: lengthGen.next().value,
      charGen,
      numGen
    });
  });
}

function randomString({ length, charGen, numGen }) {
  let isNumGen = numGen !== undefined || charGen === undefined,
      gen, toStr;
  if (isNumGen) {
    const aCode = 'a'.charCodeAt(0),
          zCode = 'z'.charCodeAt(0);
    gen = api.common.withDefault(numGen, numberGen(aCode, zCode + 1));
    toStr = String.fromCharCode;
  } else {
    gen = charGen;
    toStr = ''.concat.bind('');
  }
  let resGen = takeN(length, gen);
  return toStr(...resGen);
}

function* map(f, gen) {
  let genRes = gen.next();
  while (!genRes.done) {
    yield f(genRes.value);
    genRes = gen.next();
  }
  return f(genRes.value);
}

function forEach(f, gen) {
  do {
    let genRes = gen.next();
    f(genRes.value);
  } while (!genRes.done);
}

module.exports = {
  makeGen,
  takeN,
  randomNumber,
  numberGen,
  randomString,
  stringGen,
  map,
  forEach,
};
