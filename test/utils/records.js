'use strict';

const message = (replica, id, content) =>
  replica.assign('message', id, { content, username: 'ada' });

const values = (replica) => {
  const result = {};
  for (const id of replica.keys()) result[id] = replica.get(id);
  return result;
};

module.exports = { message, values };
