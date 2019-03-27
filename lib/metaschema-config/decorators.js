'use strict';

const { decorators, localDecorators } = require('metaschema').default.options;
const { LogStatusDecorator: LogStatus } = require('../log');

class Decorator {
  constructor(def) {
    Object.assign(this, def);
  }
}

class RelationDecorator extends Decorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def };
    }
    super(def);
  }
}

class Many extends RelationDecorator {}
class Master extends RelationDecorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def, required: true };
    } else {
      def.required = true;
    }
    super(def);
  }
}
class Include extends RelationDecorator {
  constructor(def) {
    if (typeof def === 'string') {
      def = { category: def, required: true };
    } else {
      def.required = true;
    }
    super(def);
  }
}

class Hierarchy extends RelationDecorator {
  constructor(def) {
    def.index = true;
    super(def);
  }
}

class Catalog extends Hierarchy {
  constructor(def) {
    if (!def.category) {
      def.category = 'Catalog';
    }
    def.required = true;
    super(def);
  }
}

class Subsystem extends Hierarchy {
  constructor(def) {
    if (!def.category) {
      def.category = 'Subsystem';
    }
    def.required = true;
    super(def);
  }
}

class Index {
  constructor(fields) {
    this.fields = fields;
  }
}

class Unique extends Index {}

class Registry extends Decorator {}
class Dictionary extends Decorator {}
class System extends Decorator {}
class Log extends Decorator {}
class Local extends Decorator {}
class Table extends Decorator {
  constructor(def, config) {
    super(def);
    Object.assign(this, config);
  }
}
class History extends Decorator {}

class Execute {
  constructor(def) {
    if (typeof def === 'string') {
      this.Action = def;
    } else {
      Object.assign(this, def);
    }
  }
}

class Action {
  constructor(def) {
    if (typeof def === 'function') {
      this.Execute = def;
    } else {
      Object.assign(this, def);
    }
    if (!this.Args) this.Args = {};
    if (!this.Returns) this.Returns = {};
  }
}

class View extends Decorator {}
class Memory extends Decorator {}
class Form extends Decorator {
  constructor(def) {
    super(def);
    if (!this.Fields) {
      this.Fields = {};
    }
  }
}

// Form layout decorators

class LayoutDecorator {
  constructor(name, config = {}) {
    Object.assign(this, { ...config, name });
  }
}

class Group extends LayoutDecorator {
  constructor(name, config, children) {
    super(name, config);
    this.children = children;
  }
}

class Input extends LayoutDecorator {}
class Label extends LayoutDecorator {}

class Application extends Decorator {}

class AppMenuGroup {
  constructor(name, children) {
    this.name = name;
    this.children = children;
  }
}

module.exports = {
  decorators,
  localDecorators: {
    domains: localDecorators.domains,
    category: {
      Registry: def => new Registry(def),
      Dictionary: def => new Dictionary(def),
      System: def => new System(def),
      Log: def => new Log(def),
      Local: def => new Local(def),
      Table: (def, config) => new Table(def, config),

      History: def => new History(def),
      View: def => new View(def),
      Memory: def => new Memory(def),

      Many: def => new Many(def),
      Master: def => new Master(def),
      Include: def => new Include(def),
      Hierarchy: (def = {}) => new Hierarchy(def),
      Catalog: (def = {}) => new Catalog(def),
      Subsystem: (def = {}) => new Subsystem(def),

      // Index decorators
      Index: (...fields) => new Index(fields),
      Unique: (...fields) => new Unique(fields),
      // Function decorators
      Execute: def => new Execute(def),
      Action: def => new Action(def),

      LogStatus,
    },
    action: {
      // Function decorators
      Execute: def => new Execute(def),
      Action: def => new Action(def),

      Hierarchy: (def = {}) => new Hierarchy(def),
      Catalog: (def = {}) => new Catalog(def),
      Subsystem: (def = {}) => new Subsystem(def),

      LogStatus,
    },
    form: {
      Form: def => new Form(def),
      Group: (name, config, ...children) => new Group(name, config, children),
      Input: (name, config = {}) => new Input(name, config),
      Label: (name, config = {}) => new Label(name, config),
    },
    application: {
      Application: def => new Application(def),
      Group: (name, children) => new AppMenuGroup(name, children),
    },
  },
};
