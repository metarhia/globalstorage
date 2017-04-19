'use strict';

module.exports = (api) => {

  const gs = api.gs;

  const ds1 = [ { id: 1 }, { id: 2 } ];
  const ds2 = [ { id: 2 }, { id: 3 } ];

  console.dir({
    union: gs.transformations.union(ds1, ds2),
    intersection: gs.transformations.intersection(ds1, ds2),
    difference: gs.transformations.difference(ds1, ds2),
    complement: gs.transformations.complement(ds1, ds2)
  });

  const mc1 = new gs.MemoryCursor(null, ds1);
  const mc2 = mc1.clone();

  mc1.dataset[0].name = 'qwerty';
  console.dir(mc1.dataset);
  console.dir(mc2.dataset);

  const mc3 = mc1.clone().order('id', true);
  console.dir({ mc3: mc3.dataset });

  const mc4 = mc1.clone().desc(['id', 'name'], true);
  console.dir({ mc4: mc4.dataset });

  const persons = [
    { name: 'Marcus Aurelius', city: 'Rome', born: 121 },
    { name: 'Victor Glushkov', city: 'Rostov on Don', born: 1923 },
    { name: 'Ibn Arabi', city: 'Murcia', born: 1165 },
    { name: 'Mao Zedong', city: 'Shaoshan', born: 1893 },
    { name: 'Rene Descartes', city: 'La Haye en Touraine', born: 1596 }
  ];

  const mcPersons = new gs.MemoryCursor(null, persons);
  mcPersons.select({ born: ['<', 1500] }, true).order('born', true);
  console.dir({ mcPersons: mcPersons.dataset });

};
