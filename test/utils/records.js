'use strict';

const message = (replica, id, content) => {
  const fields = { content, username: 'ada' };
  return replica.assign('message', id, fields);
};

const values = (replica) => {
  const result = {};
  for (const id of replica.keys()) result[id] = replica.get(id);
  return result;
};

module.exports = { message, values };
