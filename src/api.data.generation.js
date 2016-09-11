let fs = require('fs'),
    util = require('util'),
    api = require('./api')('gen', 'common');

const valGens = [
  () => api.gen.numberGen(0, 1000000),
  () => api.gen.stringGen({ lengthGen: api.gen.numberGen(1, 10) }),
  () => api.gen.map(x => x === 1, api.gen.numberGen(1, 3)),
];

function writeNObjs(filenames, objCount, sep) {
  let outs = filenames.map(filename => fs.createWriteStream(filename)),
      objs = api.gen.takeN(objCount, objGen());
  api.gen.forEach(obj => {
    outs.forEach(out => {
      out.write(util.inspect(obj, { breakLength: Infinity }));
      out.write(sep);
    });
  }, objs);
  outs.forEach(out => out.end());
}

function objGen({ fieldnameGen, fieldCountGen, valGen } = {}) {
  fieldnameLengthGen = api.gen.numberGen(1, 10),
  fieldnameGen = api.common.withDefault(fieldnameGen, api.gen.stringGen({ lengthGen: fieldnameGen }));
  fieldCountGen = api.common.withDefault(fieldCountGen, api.gen.numberGen(1, 5));
  valGen = api.common.withDefault(valGen, randomValueGen());
  return api.gen.makeGen(() => {
    let obj = {};
    let s = fieldCountGen.next().value;
    for (var j = 0; j < s; j++) { 
      let fieldname = fieldnameGen.next().value;
      obj[fieldname] = valGen.next().value;
    }
    return obj;
  });
}

function randomValue() {
  return valGens[api.gen.randomNumber(0, valGens.length)].next().value;
}

function randomValueGen() {
  return api.gen.makeGen(randomValue);
}

module.exports = {
  objGen,
  writeNObjs,  
};
