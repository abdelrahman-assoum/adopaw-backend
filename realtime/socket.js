// CommonJS
const { oid, getDb } = require('./utilsDb');

module.exports = function registerSocket(io) {
  io.on('connection', async (socket) => {
    const userId = oid(socket.userId);
    socket.join(`user:${userId}`);

    socket.on('chat:join', ({ chatId }) => socket.join(`chat:${chatId}`));
    socket.on('chat:leave', ({ chatId }) => socket.leave(`chat:${chatId}`));

    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit(`typing:${chatId}`, {
        chatId, userId: String(userId), isTyping: !!isTyping, at: Date.now()
      });
    });

    socket.on('message:send', async (payload, cb) => {
      try {
        const db = await getDb();
        const chatId = oid(payload.chatId);

        const part = await db.collection('participants').findOne({ chatId, userId });
        if (!part) return cb?.({ ok:false, error:'forbidden' });

        const doc = {
          chatId,
          senderId: userId,
          role: 'user',
          type: payload.type,
          content: payload.content || {},
          clientId: payload.clientId || null,
          createdAt: new Date(),
          editedAt: null,
          deletedAt: null,
        };

        const { insertedId } = await db.collection('messages').insertOne(doc);
        await db.collection('chats').updateOne(
          { _id: chatId },
          { $set: { lastMessageAt: doc.createdAt, lastMessageId: insertedId } }
        );
        cb?.({ ok:true, _id: String(insertedId) });
        // Note: new message broadcast comes from change stream (streams.js)
      } catch (e) {
        cb?.({ ok:false, error: e.message });
      }
    });

    socket.on('read', async ({ chatId, messageId }) => {
      const db = await getDb();
      const cId = oid(chatId), mId = oid(messageId);

      const part = await db.collection('participants').findOne({ chatId: cId, userId });
      if (!part) return;

      await db.collection('participants').updateOne(
        { chatId: cId, userId },
        { $set: { lastReadAt: new Date() } }
      );
      await db.collection('read_receipts').updateOne(
        { chatId: cId, messageId: mId, userId },
        { $set: { readAt: new Date() } }, { upsert:true }
      );

      // echo
      socket.to(`chat:${chatId}`).emit(`message:read:${chatId}`, {
        chatId, messageId, userId: String(userId), readAt: Date.now()
      });
    });
  });
};
