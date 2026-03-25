/* eslint-disable max-len */
'use strict';

const repl = require('node:repl');
const os = require('node:os');
const path = require('node:path');
const gs = require('../gs.js');

const seed = [
  {
    title: 'Term Frequency (TF)',
    body: `Term Frequency (TF) measures how frequently a specific term (word or phrase) appears in a document, used in information retrieval and text mining to determine keyword relevance. Calculated as the ratio of a term's count to the total terms in a document, higher TF suggests greater importance, frequently combined with Inverse Document Frequency (IDF).`,
  },
  {
    title: 'Inverse Document Frequency (IDF)',
    body: 'Inverse Document Frequency (IDF) is a metric that evaluates how rare or common a word is across a collection of documents.',
  },
  {
    title: 'TF-IDF',
    body: 'TF-IDF is the product of TF and IDF, used to rank documents based on the importance of the terms in the query.',
  },
  {
    title: 'Trigram Index',
    body: 'A trigram index is a data structure that stores all possible three-character combinations (trigrams) of a document, used to quickly search for documents containing specific words or phrases.',
  },
];

const main = async () => {
  const storagePath = path.join(os.tmpdir(), `gs-fts-demo-${Date.now()}`);
  const storage = await gs.open({ path: storagePath });

  console.log('Seeding %d records...', seed.length);
  for (const data of seed) {
    await storage.insert(data);
  }
  console.log('Done.\n');
  console.log('Usage:  await search("query")');
  console.log('        await search("query", limit)\n');

  const search = async (query, limit) => {
    const results = storage.search(query, limit);
    for (const { id, score } of results) {
      const data = await storage.get(id);
      const title = data?.title ?? '(no title)';
      console.log(`  [${score.toFixed(4)}]  ${title}`);
    }
    return `${results.length} result(s)`;
  };

  const r = repl.start({ prompt: 'fts> ' });
  r.context.storage = storage;
  r.context.search = search;
};

main();
