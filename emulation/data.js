'use strict';

const { generateUUID } = require('metautil');

const createInitialData = () => {
  const now = new Date().toISOString();
  const author1Id = generateUUID();
  const author2Id = generateUUID();
  const author3Id = generateUUID();
  const author4Id = generateUUID();
  const feed1Id = generateUUID();
  const feed2Id = generateUUID();
  const chat1Id = generateUUID();
  const chat2Id = generateUUID();
  const file1Id = generateUUID();
  const file2Id = generateUUID();
  const file3Id = generateUUID();
  const folder1Id = generateUUID();
  const folder2Id = generateUUID();
  const message1Id = generateUUID();
  const message2Id = generateUUID();
  const message3Id = generateUUID();
  const message4Id = generateUUID();
  const post1Id = generateUUID();
  const post2Id = generateUUID();
  const post3Id = generateUUID();
  const post4Id = generateUUID();
  const node1Id = generateUUID();
  const node2Id = generateUUID();
  const peer1Id = generateUUID();
  const peer2Id = generateUUID();

  const data = {};

  data[author1Id] = {
    nick: 'marcus_aurelius',
    name: 'Marcus Aurelius Antoninus',
    bio: 'Roman Emperor, Stoic philosopher, author of Meditations',
    icon: '⚔️',
    photo: file1Id,
    status: 'online',
    created: now,
    updated: now,
    settings: { theme: 'dark', notifications: true },
    nodes: [node1Id, node2Id],
  };

  data[author2Id] = {
    nick: 'faustina',
    name: 'Faustina the Younger',
    bio: 'Empress of Rome, wife of Marcus Aurelius',
    icon: '👑',
    photo: file2Id,
    status: 'away',
    created: now,
    updated: now,
    settings: { theme: 'light', notifications: true },
    nodes: [node1Id],
  };

  data[author3Id] = {
    nick: 'lucius_verus',
    name: 'Lucius Verus',
    bio: 'Roman co-emperor, brother of Marcus Aurelius',
    icon: '🛡️',
    photo: null,
    status: 'online',
    created: now,
    updated: now,
    settings: { theme: 'dark', notifications: false },
    nodes: [node2Id],
  };

  data[author4Id] = {
    nick: 'commodus',
    name: 'Commodus Antoninus',
    bio: 'Roman Emperor, son of Marcus Aurelius',
    icon: '🗡️',
    photo: file3Id,
    status: 'dnd',
    created: now,
    updated: now,
    settings: { theme: 'dark', notifications: true },
    nodes: [node1Id],
  };

  data[folder1Id] = {
    name: 'Imperial Documents',
    owner: author1Id,
    icon: '📜',
    description: 'Official imperial decrees and philosophical works',
    created: now,
  };

  data[folder2Id] = {
    name: 'Personal Correspondence',
    owner: author2Id,
    icon: '📬',
    description: 'Private letters and messages',
    created: now,
  };

  data[file1Id] = {
    name: 'marcus_aurelius_portrait.jpg',
    owner: author1Id,
    folder: folder1Id,
    icon: '🖼️',
    description: 'Official imperial portrait',
    mime: 'image/jpeg',
    size: 245678,
    checksum:
      'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    created: now,
    modified: now,
    visibility: 'public',
  };

  data[file2Id] = {
    name: 'faustina_bust.sculpture',
    owner: author2Id,
    folder: folder2Id,
    icon: '🗿',
    description: 'Marble bust sculpture',
    mime: 'image/sculpture',
    size: 1024000,
    checksum:
      'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
    created: now,
    modified: now,
    visibility: 'unlisted',
  };

  data[file3Id] = {
    name: 'meditations_book.pdf',
    owner: author1Id,
    folder: folder1Id,
    icon: '📖',
    description: 'Meditations by Marcus Aurelius',
    mime: 'application/pdf',
    size: 512000,
    checksum:
      'c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
    created: now,
    modified: now,
    visibility: 'public',
  };

  data[feed1Id] = {
    name: 'Senatus Populusque Romanus',
    owner: author1Id,
    icon: '🏛️',
    description: 'Official announcements from the Senate and People of Rome',
    created: now,
    visibility: 'public',
    joinPolicy: 'open',
    pinned: [post1Id],
  };

  data[feed2Id] = {
    name: 'Stoic Philosophy',
    owner: author1Id,
    icon: '📚',
    description: 'Discussions on Stoic philosophy and wisdom',
    created: now,
    visibility: 'public',
    joinPolicy: 'open',
    pinned: [post2Id],
  };

  data[post1Id] = {
    title: 'On the Duty of an Emperor',
    subtitle: 'Meditations Book I',
    content:
      'From my grandfather Verus: I learned good morals and the government ' +
      'of my temper. From the reputation and remembrance of my father: ' +
      'modesty and a manly character. From my mother: piety and ' +
      'beneficence, and abstinence, not only from evil deeds, but even ' +
      'from evil thoughts; and further, simplicity in my way of living, ' +
      'far removed from the habits of the rich.',
    feed: feed1Id,
    author: author1Id,
    created: now,
    edited: null,
    published: now,
    deleted: null,
    status: 'published',
    reactions: { '⚔️': [author2Id, author3Id], '📚': [author4Id] },
    pinned: true,
    attachments: [file3Id],
  };

  data[post2Id] = {
    title: 'The Universe is Change',
    subtitle: 'Meditations Book IV',
    content:
      'The universe is transformation: life is opinion. If a man will take ' +
      'to heart that all things which happen have been from eternity, and ' +
      'in like manner will be to all eternity, he will more easily bear ' +
      'himself contentedly.',
    feed: feed2Id,
    author: author1Id,
    created: now,
    edited: null,
    published: now,
    deleted: null,
    status: 'published',
    reactions: { '📚': [author2Id, author3Id], '💭': [author4Id] },
    pinned: true,
    attachments: [],
  };

  data[post3Id] = {
    title: 'Preparations for the Parthian Campaign',
    subtitle: 'Military Strategy',
    content:
      'Lucius Verus and I shall lead the legions east. The Parthians have ' +
      'crossed our borders. We must act with haste but maintain discipline. ' +
      'The soldiers trust in our leadership.',
    feed: feed1Id,
    author: author1Id,
    created: now,
    edited: null,
    published: now,
    deleted: null,
    status: 'published',
    reactions: { '⚔️': [author3Id], '🛡️': [author2Id] },
    pinned: false,
    attachments: [],
  };

  data[post4Id] = {
    title: 'The Duties of an Empress',
    subtitle: 'Personal Reflections',
    content:
      'As empress, my role extends beyond the palace walls. I must support ' +
      'my husband in his duties while maintaining the dignity of the ' +
      'imperial household. The people look to us as examples.',
    feed: feed2Id,
    author: author2Id,
    created: now,
    edited: null,
    published: null,
    deleted: null,
    status: 'draft',
    reactions: {},
    pinned: false,
    attachments: [file2Id],
  };

  data[chat1Id] = {
    name: 'Imperial Council',
    owner: author1Id,
    icon: '👑',
    description: 'Private discussions of the imperial family and advisors',
    created: now,
    lastActivity: now,
    members: [author1Id, author2Id, author3Id, author4Id],
    admins: [author1Id],
    moderators: [author2Id],
    mute: [],
    ban: [],
    pinned: [message1Id],
  };

  data[chat2Id] = {
    name: 'Military Command',
    owner: author1Id,
    icon: '⚔️',
    description: 'Strategic discussions and military planning',
    created: now,
    lastActivity: now,
    members: [author1Id, author3Id],
    admins: [author1Id],
    moderators: [],
    mute: [],
    ban: [],
    pinned: [message3Id],
  };

  data[message1Id] = {
    chat: chat1Id,
    author: author1Id,
    content:
      'Greetings to all. We must discuss the upcoming campaigns and the ' +
      'administration of the provinces. Your counsel is valued.',
    created: now,
    edited: null,
    deleted: null,
    replyTo: null,
    forwarded: null,
    reactions: { '👍': [author2Id, author3Id] },
    pinned: true,
    attachments: [],
  };

  data[message2Id] = {
    chat: chat1Id,
    author: author2Id,
    content:
      'The preparations for the victory celebrations are underway. The ' +
      'people expect great spectacle. We must not disappoint them.',
    created: now,
    edited: null,
    deleted: null,
    replyTo: message1Id,
    forwarded: null,
    reactions: { '👑': [author1Id] },
    pinned: false,
    attachments: [],
  };

  data[message3Id] = {
    chat: chat2Id,
    author: author3Id,
    content:
      'The legions are ready. We have sufficient supplies for the march. ' +
      'When do we depart for the eastern provinces?',
    created: now,
    edited: null,
    deleted: null,
    replyTo: null,
    forwarded: null,
    reactions: { '⚔️': [author1Id] },
    pinned: true,
    attachments: [],
  };

  data[message4Id] = {
    chat: chat2Id,
    author: author1Id,
    content:
      'We march at dawn in three days. Ensure the cavalry is prepared. ' +
      'The Parthians favor mounted combat - we must match their mobility.',
    created: now,
    edited: null,
    deleted: null,
    replyTo: message3Id,
    forwarded: null,
    reactions: { '🛡️': [author3Id] },
    pinned: false,
    attachments: [],
  };

  data[node1Id] = {
    name: 'Roma Capital',
    domain: 'roma.imperium',
    ip: '192.168.1.100',
    ports: [8001, 8002],
  };

  data[node2Id] = {
    name: 'Antioch Province',
    domain: 'antioch.imperium',
    ip: '192.168.1.101',
    ports: [8001],
  };

  data[peer1Id] = {
    name: 'Athens Academy',
    domain: 'athens.imperium',
    ip: '192.168.1.102',
    ports: [8001],
  };

  data[peer2Id] = {
    name: 'Alexandria Library',
    domain: 'alexandria.imperium',
    ip: '192.168.1.103',
    ports: [8001, 8002],
  };

  return data;
};

let cachedData = null;
let cachedIds = null;

const getInitialDataWithIds = () => {
  if (!cachedData) {
    cachedData = createInitialData();
    const ids = Object.keys(cachedData);
    cachedIds = {
      authors: ids.filter((id) => cachedData[id].nick),
      posts: ids.filter((id) => cachedData[id].title),
      chats: ids.filter((id) => cachedData[id].members),
      messages: ids.filter((id) => cachedData[id].chat),
    };
  }
  return { data: cachedData, ids: cachedIds };
};

module.exports = { createInitialData, getInitialDataWithIds };
