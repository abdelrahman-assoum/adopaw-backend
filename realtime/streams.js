const { getDb } = require('./utilsDb');

async function buildUnread(db, chatId, userId) {
  const me = await db.collection('participants').findOne({ chatId, userId });
  return db.collection('messages').countDocuments({
    chatId, createdAt: { $gt: me?.lastReadAt || new Date(0) }
  });
}

module.exports.wireStreams = async function wireStreams(io) {
  const db = await getDb();
  const stream = db.collection('messages').watch([], { fullDocument: 'updateLookup' });

  stream.on('change', async (ev) => {
    if (ev.operationType !== 'insert') return;
    const m = ev.fullDocument;
    const chatId = String(m.chatId);

    // 1) broadcast new message to chat room
    io.to(`chat:${chatId}`).emit(`message:new:${chatId}`, { ...m, _id: String(m._id) });

    // 2) update chat list for each participant
    const parts = await db.collection('participants').find({ chatId: m.chatId }).project({ userId:1 }).toArray();
    const last = { type:m.type, role:m.role, content:m.content, createdAt:m.createdAt };

    for (const p of parts) {
      const unread = await buildUnread(db, m.chatId, p.userId);
      io.to(`user:${String(p.userId)}`).emit('chat:list:update', {
        type: 'upsert',
        chat: { _id: chatId, lastMessageAt: m.createdAt, lastMessage: last, unreadCount: unread }
      });
    }
  });

  stream.on('error', (e) => console.error('Change stream error:', e.message));
};
