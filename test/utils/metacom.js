'use strict';

const { Emitter } = require('metautil');

const copy = (data) => {
  const json = JSON.stringify(data);
  return json === undefined ? data : JSON.parse(json);
};

const tick = () =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const until = async (check, attempts = 200) => {
  for (let i = 0; i < attempts; i++) {
    if (check()) return;
    await tick();
  }
  throw new Error('Condition is not reached');
};

// Server side `context.client`: emit sends an event to its connection
class HubClient extends Emitter {
  #connection = null;

  constructor(connection) {
    super();
    this.#connection = connection;
  }

  emit(name, data) {
    if (name === 'close') return super.emit(name, data);
    this.#connection.deliver(name, data);
    return Promise.resolve();
  }
}

// In-memory metacom connection with the client API used by Uplink:
// active, open and close events, load, api units with methods and events
class Connection extends Emitter {
  #units = null;
  #client = null;
  api = {};
  active = false;
  isDropping = false;
  calls = [];

  constructor(units) {
    super();
    this.#units = units;
  }

  open() {
    this.active = true;
    this.#client = new HubClient(this);
    this.emit('open');
  }

  close() {
    const client = this.#client;
    this.active = false;
    this.#client = null;
    if (client) client.emit('close');
    this.emit('close');
  }

  async load(...names) {
    if (!this.active) throw new Error('Not connected');
    for (const unit of names) {
      const handlers = this.#units[unit];
      if (!handlers) continue;
      const methods = this.api[unit] ?? new Emitter();
      for (const name of Object.keys(handlers)) {
        methods[name] = (args = {}) => this.#call(unit, name, args);
      }
      this.api[unit] = methods;
    }
  }

  async #call(unit, name, args) {
    if (!this.active) throw new Error('Not connected');
    this.calls.push({ method: `${unit}/${name}`, args: copy(args) });
    const handler = this.#units[unit][name];
    const context = { client: this.#client };
    await tick();
    const result = await handler(copy(args), context);
    if (!this.active) throw new Error('Connection closed');
    return copy(result);
  }

  deliver(name, data) {
    const packet = copy(data);
    setImmediate(() => {
      if (!this.active || this.isDropping) return;
      const index = name.indexOf('/');
      const unit = name.slice(0, index);
      const event = name.slice(index + 1);
      const methods = this.api[unit];
      if (methods) methods.emit(event, packet);
    });
  }
}

module.exports = { Connection, tick, until };
