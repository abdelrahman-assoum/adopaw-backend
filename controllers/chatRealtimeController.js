// controllers/chatRealtimeController.js
// We use the native driver via realtime/utilsDb so that Mongo Change Streams fire reliably
const { getDb, oid } = require('../realtime/utilsDb');

/** Make sure participants array contains unique strings and includes the requester. */
function normalizeParticipants(reqUserId, participants) {
  const ids = new Set([String(reqUserId), ...(participants || []).map(String)]);
  return Array.from(ids);
}

/** POST /chat-api/chats  { participants: ["otherUserId"] } -> { chatId } */
exports.createDirectChat = async (req, res) => {
  try {
    const db = await getDb();
    const userIds = normalizeParticipants(req.userId, req.body?.participants);

    if (userIds.length < 2) return res.status(400).json({ error: 'need at least 2 participants' });

    // Check if a 1:1 chat already exists with exactly these users (order-agnostic)
    // This finds chats where participants set == userIds
    const agg = await db.collection('participants').aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$chatId', users: { $addToSet: '$userId' }, count: { $sum: 1 } } },
      { $match: { count: userIds.length } }
    ]).toArray();

    if (agg.length) {
      return res.json({ chatId: String(agg[0]._id), created: false });
    }

    // Create new chat + participants
    const { insertedId: chatId } = await db.collection('chats').insertOne({
      isGroup: false, lastMessageAt: null, lastMessageId: null
    });

    const docs = userIds.map(uid => ({
      chatId, userId: String(uid), joinedAt: new Date(), lastReadAt: new Date(0)
    }));
    await db.collection('participants').insertMany(docs);

    res.status(201).json({ chatId: String(chatId), created: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** GET /chat-api/me/chats */
exports.listMyChats = async (req, res) => {
  try {
    const db = await getDb();
    const userId = String(req.userId);

    const parts = await db.collection('participants').find({ userId }).toArray();
    if (!parts.length) return res.json({ items: [] });

    const chatIds = parts.map(p => p.chatId);
    const chats = await db.collection('chats').find({ _id: { $in: chatIds } }).toArray();

    const items = await Promise.all(chats.map(async (c) => {
      const last = c.lastMessageId ? await db.collection('messages').findOne({ _id: c.lastMessageId }) : null;
      const me = parts.find(p => String(p.chatId) === String(c._id));
      const unread = await db.collection('messages').countDocuments({
        chatId: c._id, createdAt: { $gt: me?.lastReadAt || new Date(0) }
      });
      return {
        _id: String(c._id),
        isGroup: !!c.isGroup,
        lastMessageAt: c.lastMessageAt,
        unreadCount: unread,
        lastMessage: last ? { type: last.type, role: last.role, content: last.content, createdAt: last.createdAt } : null
      };
    }));

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** GET /chat-api/chats/:id/messages?limit&cursorTs&cursorId */
exports.getMessages = async (req, res) => {
  try {
    const db = await getDb();
    const chatId = oid(req.params.id);
    const userId = String(req.userId);

    const isPart = await db.collection('participants').findOne({ chatId, userId });
    if (!isPart) return res.status(403).json({ error: 'forbidden' });

    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const cursorTs = req.query.cursorTs ? new Date(Number(req.query.cursorTs)) : null;
    const cursorId = req.query.cursorId ? oid(req.query.cursorId) : null;

    const filter = { chatId };
    if (cursorTs) {
      filter.$or = [
        { createdAt: { $lt: cursorTs } },
        { createdAt: cursorTs, _id: { $lt: cursorId } }
      ];
    }

    const items = await db.collection('messages')
      .find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();

    const nextCursor = (items.length === limit)
      ? { ts: items[items.length - 1].createdAt.getTime(), id: String(items[items.length - 1]._id) }
      : null;

    res.json({ items: items.map(m => ({ ...m, _id: String(m._id) })), nextCursor });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** POST /chat-api/chats/:id/messages  (helper for Postman testing only) */
exports.postMessage = async (req, res) => {
  try {
    const db = await getDb();
    const chatId = oid(req.params.id);
    const userId = String(req.userId);

    const isPart = await db.collection('participants').findOne({ chatId, userId });
    if (!isPart) return res.status(403).json({ error: 'forbidden' });

    const { type = 'text', content = {}, clientId = null } = req.body || {};
    const doc = {
      chatId, senderId: userId, role: 'user',
      type, content, clientId,
      createdAt: new Date(), editedAt: null, deletedAt: null
    };
    const { insertedId } = await db.collection('messages').insertOne(doc);
    await db.collection('chats').updateOne(
      { _id: chatId },
      { $set: { lastMessageAt: doc.createdAt, lastMessageId: insertedId } }
    );
    // Change Stream will emit to sockets automatically
    res.status(201).json({ ok: true, _id: String(insertedId) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
