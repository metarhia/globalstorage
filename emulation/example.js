'use strict';

const globalStorage = require('./storage.js');
const { getInitialDataWithIds } = require('./data.js');

const formatAuthor = (author) =>
  `${author.icon} ${author.name} (@${author.nick}) - ${author.bio}`;

const nameOf = (authors, id) => authors.get(id)?.name ?? 'Unknown';

const formatMessage = (message, authors) => {
  const authorName = nameOf(authors, message.author);
  const reactions = message.reactions ?? {};
  const parts = [];
  for (const emoji in reactions) {
    const names = reactions[emoji].map((id) => nameOf(authors, id));
    parts.push(`${emoji} (${names.join(', ')})`);
  }
  const list = parts.join(' | ');
  const reactionsText = list ? `\n  Reactions: ${list}` : '';
  return `  ${authorName}: ${message.content}${reactionsText}`;
};

const formatPost = (post, authors) => {
  const authorName = nameOf(authors, post.author);
  const status = post.status === 'published' ? '✓' : '○';
  const reactions = post.reactions ?? {};
  const parts = [];
  for (const emoji in reactions) {
    const count = reactions[emoji]?.length ?? 0;
    parts.push(`${emoji} ${count}`);
  }
  const list = parts.join(' ');
  const reactionsText = list ? ` [${list}]` : '';
  const preview = post.content.substring(0, 100);
  const dots = post.content.length > 100 ? '...' : '';
  const byLine = `\n  by ${authorName}\n  ${preview}${dots}`;
  return `[${status}] ${post.title}${reactionsText}${byLine}`;
};

const loadAll = async (storage, ids) => {
  const loaded = await Promise.all(ids.map((id) => storage.get(id)));
  const records = new Map();
  for (let i = 0; i < ids.length; i++) {
    if (loaded[i]) records.set(ids[i], loaded[i]);
  }
  return records;
};

const addReaction = async (storage, id, emoji, authorId) => {
  const record = await storage.get(id);
  if (!record) return null;
  const reactions = record.reactions ?? {};
  const authorIds = reactions[emoji] ?? [];
  if (!authorIds.includes(authorId)) authorIds.push(authorId);
  reactions[emoji] = authorIds;
  await storage.update(id, { reactions });
  return record;
};

const main = async () => {
  const storage = await globalStorage.open();

  const { ids } = getInitialDataWithIds();
  const loading = [ids.authors, ids.posts, ids.chats, ids.messages];
  const loaders = loading.map((list) => loadAll(storage, list));
  const loaded = await Promise.all(loaders);
  const authors = loaded[0];
  const posts = Array.from(loaded[1].values());
  const chats = loaded[2];
  const messages = Array.from(loaded[3].values());

  console.log('\nIMPERIAL AUTHOR DIRECTORY\n');

  for (const author of authors.values()) console.log(formatAuthor(author));

  console.log('\nRECENT POSTS\n');

  for (const post of posts) {
    console.log(formatPost(post, authors));
    console.log('');
  }

  console.log('\nMESSAGES\n');

  for (const entry of chats) {
    const chatId = entry[0];
    const chat = entry[1];
    const description = chat.description || '';
    console.log(` conversation: ${chat.name} (${description})`);
    const isInChat = (message) => message.chat === chatId;
    for (const message of messages.filter(isInChat)) {
      console.log(formatMessage(message, authors));
    }
    console.log('');
  }

  console.log('\nADDING REACTIONS\n');

  const firstPostId = ids.posts[0];
  const marcusId = ids.authors[0];
  const post = await addReaction(storage, firstPostId, '👏', marcusId);
  if (post) console.log('✅ Added 👏 reaction to post:', post.title);

  const firstMessageId = ids.messages[0];
  const faustinaId = ids.authors[1];
  const message = await addReaction(storage, firstMessageId, '💬', faustinaId);
  if (message) console.log('✅ Added 💬 reaction to message');

  console.log('\nUPDATED DATA\n');

  const updatedPost = await storage.get(firstPostId);
  if (updatedPost) {
    console.log(formatPost(updatedPost, authors));
  }

  const updatedMessage = await storage.get(firstMessageId);
  if (updatedMessage) {
    console.log(`\n${formatMessage(updatedMessage, authors)}`);
  }

  console.log('\n');
};

main().catch(console.error);
