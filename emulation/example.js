'use strict';

const globalStorage = require('./storage.js');

const formatAuthor = (author) =>
  `${author.icon} ${author.name} (@${author.nick}) - ${author.bio}`;

const formatMessage = (message, authors) => {
  const author = authors.get(message.author);
  const authorName = author ? author.name : 'Unknown';
  const reactions = Object.entries(message.reactions || {})
    .map(([emoji, authorIds]) => {
      const names = authorIds
        .map((id) => {
          const a = authors.get(id);
          return a ? a.name : 'Unknown';
        })
        .join(', ');
      return `${emoji} (${names})`;
    })
    .join(' | ');
  const reactionsText = reactions ? `\n  Reactions: ${reactions}` : '';
  return `  ${authorName}: ${message.content}${reactionsText}`;
};

const formatPost = (post, authors) => {
  const author = authors.get(post.author);
  const authorName = author ? author.name : 'Unknown';
  const status = post.status === 'published' ? '✓' : '○';
  const reactions = Object.entries(post.reactions || {})
    .map(([emoji, authorIds]) => {
      const count = authorIds ? authorIds.length : 0;
      return `${emoji} ${count}`;
    })
    .join(' ');
  const reactionsText = reactions ? ` [${reactions}]` : '';
  const preview = post.content.substring(0, 100);
  const dots = post.content.length > 100 ? '...' : '';
  const byLine = `\n  by ${authorName}\n  ${preview}${dots}`;
  return `[${status}] ${post.title}${reactionsText}${byLine}`;
};

const main = async () => {
  const storage = await globalStorage.open();

  const authors = new Map();
  const posts = [];
  const messages = [];
  const chats = new Map();

  const { getInitialDataWithIds } = require('./data.js');
  const { ids } = getInitialDataWithIds();

  for (const authorId of ids.authors) {
    const author = await storage.get(authorId);
    if (author) authors.set(authorId, author);
  }

  for (const postId of ids.posts) {
    const post = await storage.get(postId);
    if (post) posts.push(post);
  }

  for (const chatId of ids.chats) {
    const chat = await storage.get(chatId);
    if (chat) chats.set(chatId, chat);
  }

  for (const messageId of ids.messages) {
    const message = await storage.get(messageId);
    if (message) messages.push(message);
  }

  console.log('\nIMPERIAL AUTHOR DIRECTORY\n');

  authors.forEach((author) => {
    console.log(formatAuthor(author));
  });

  console.log('\nRECENT POSTS\n');

  posts.forEach((post) => {
    console.log(formatPost(post, authors));
    console.log('');
  });

  console.log('\nMESSAGES\n');

  chats.forEach((chat, chatId) => {
    const desc = chat.description || '';
    console.log(` conversation: ${chat.name} (${desc})`);
    const chatMessages = messages.filter((m) => m.chat === chatId);
    chatMessages.forEach((message) => {
      console.log(formatMessage(message, authors));
    });
    console.log('');
  });

  console.log('\nADDING REACTIONS\n');

  const { ids: initialIds } = getInitialDataWithIds();
  const firstPostId = initialIds.posts[0];
  const firstPost = await storage.get(firstPostId);
  if (firstPost) {
    const currentReactions = firstPost.reactions || {};
    const marcusId = initialIds.authors[0];
    if (!currentReactions['👏']) {
      currentReactions['👏'] = [];
    }
    if (!currentReactions['👏'].includes(marcusId)) {
      currentReactions['👏'].push(marcusId);
    }
    await storage.update(firstPostId, { reactions: currentReactions });
    console.log('✅ Added 👏 reaction to post:', firstPost.title);
  }

  const firstMessageId = initialIds.messages[0];
  const firstMessage = await storage.get(firstMessageId);
  if (firstMessage) {
    const currentReactions = firstMessage.reactions || {};
    const faustinaId = initialIds.authors[1];
    if (!currentReactions['💬']) {
      currentReactions['💬'] = [];
    }
    if (!currentReactions['💬'].includes(faustinaId)) {
      currentReactions['💬'].push(faustinaId);
    }
    await storage.update(firstMessageId, { reactions: currentReactions });
    console.log('✅ Added 💬 reaction to message');
  }

  console.log('\nUPDATED DATA\n');

  const updatedPost = await storage.get(firstPostId);
  if (updatedPost) {
    console.log(formatPost(updatedPost, authors));
  }

  const updatedMessage = await storage.get(firstMessageId);
  if (updatedMessage) {
    console.log('\n' + formatMessage(updatedMessage, authors));
  }

  console.log('\n');
};

main().catch(console.error);
