'use strict';

const gs = require('..');

const data = { name: 'Marcus Aurelius', born: 121 };

const transaction = gs.Transaction.start(data);

transaction.name = 'Mao Zedong';
transaction.born = 1893;
transaction.city = 'Shaoshan';
transaction.age = (
  new Date().getFullYear() -
  new Date(transaction.born + '').getFullYear()
);

console.dir({ transaction });
console.dir({ delta: transaction.delta });

transaction.commit();
console.dir({ data });
console.dir({ transaction });
console.dir({ delta: transaction.delta });

transaction.born = 1976;
console.dir({ transaction });
console.dir({ delta: transaction.delta });

transaction.rollback();
console.dir({ data });
console.dir({ transaction });
console.dir({ delta: transaction.delta });

transaction.city = 'Beijing';
delete transaction.born;

console.dir({
  keys: Object.keys(transaction),
  delta: transaction.delta
});

console.dir({ data });
transaction.commit();
console.dir({ data });
