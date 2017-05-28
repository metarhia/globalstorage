module.exports = (...args) => {
  let api = {};
  args.forEach(module => {
    let pathes = module.split('.'),
        obj = api;
    for (let i = 0; i < pathes.length - 1; i++) {
      if (!(pathes[i] in obj)) {
        obj[pathes[i]] = {};
      }
      obj = obj[pathes[i]];
    }
    obj[pathes[pathes.length-1]] = require('./api.'+module);
  });
  return api;
};
