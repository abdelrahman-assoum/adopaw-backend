// routes/chatRealtimeRoute.js
const router = require('express').Router();
const supabaseAuth = require('../middlewares/supabaseAuth'); // sets req.user.id to Mongo ObjectId *string* of your Profile
const Chat = require('../models/Chat');
const Participant = require('../models/Participant');
const Message = require('../models/Message');
const { Types } = require('mongoose');

const toOid = (v) => {
    if (v == null) return null;
    if (v instanceof Types.ObjectId) return v;
    if (typeof v === 'string' && Types.ObjectId.isValid(v)) return new Types.ObjectId(v);
    throw new Error('invalid_objectid');
};
const mkKey = (a, b, petId) => `${petId || 'none'}:${[String(a), String(b)].sort().join(':')}`;

/** Ensure (or create) a chat for (currentUser, otherUserId, optional petId) */
router.post('/chats/ensure', supabaseAuth, async (req, res) => {
    try {
        const meStr = req.user?.id;
        const { otherUserId, petId: petRaw } = req.body || {};
        if (!meStr) return res.status(401).json({ error: 'unauthenticated' });
        if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });
        if (String(otherUserId) === String(meStr)) {
            return res.status(400).json({ error: 'cannot chat with self' });
        }

        const me = toOid(meStr);
        const other = toOid(otherUserId);
        const petId = petRaw ? toOid(petRaw) : null;

        const key = mkKey(me, other, petId ? String(petId) : null);

        // 🔒 Atomic upsert by key (prevents duplicate Chat docs)
        const now = new Date();
        const chat = await Chat.findOneAndUpdate(
            { key },
            { $setOnInsert: { key, petId, lastMessageAt: now } },
            { new: true, upsert: true }
        );

        // Ensure exactly one Participant row per (chat,user)
        await Participant.updateOne(
            { chatId: chat._id, userId: me },
            { $setOnInsert: { role: 'adopter', lastReadAt: new Date(0) } },
            { upsert: true }
        );
        await Participant.updateOne(
            { chatId: chat._id, userId: other },
            { $setOnInsert: { role: 'owner', lastReadAt: new Date(0) } },
            { upsert: true }
        );

        return res.json({ chatId: String(chat._id), created: true });
    } catch (err) {
        if (err.message === 'invalid_objectid') return res.status(400).json({ error: 'invalid id format' });
        console.error('ensure chat error:', err);
        return res.status(500).json({ error: 'internal_error' });
    }
});

router.post('/chats/:id/read', supabaseAuth, async (req, res) => {
  try {
    const chatId = toOid(req.params.id);
    const me = toOid(req.user.id);
    await Participant.updateOne(
      { chatId, userId: me },
      { $set: { lastReadAt: new Date() } }
    );

    // optional: push a list update immediately
    const io = req.app.get('io');
    if (io) {
      const chat = await Chat.findById(chatId);
      let last = null;
      if (chat?.lastMessageId) {
        const m = await Message.findById(chat.lastMessageId);
        if (m) {
          last = {
            _id: String(m._id),
            type: m.type,
            content: m.content,
            createdAt: m.createdAt,
            senderId: String(m.senderId),
          };
        }
      }
      io.to(`user:${String(me)}`).emit('chat:list:update', {
        type: 'upsert',
        chat: {
          _id: String(chatId),
          lastMessageAt: chat?.lastMessageAt || new Date(),
          lastMessage: last,
          unreadCount: 0,
        }
      });
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});




/** My chats list — includes peer and lastMessage (IDs as strings) */
router.get('/me/chats', supabaseAuth, async (req, res) => {
    try {
        const me = toOid(req.user.id);

        const rows = await Participant.aggregate([
            { $match: { userId: me } },                                            // mePart
            { $lookup: { from: 'chats', localField: 'chatId', foreignField: '_id', as: 'chat' } },
            { $unwind: '$chat' },

            // other (peer) participant
            {
                $lookup: {
                    from: 'participants',
                    let: { cid: '$chatId', me: '$userId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$chatId', '$$cid'] },
                                        { $ne: ['$userId', '$$me'] },
                                    ]
                                }
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: 'peerPart'
                }
            },
            { $unwind: { path: '$peerPart', preserveNullAndEmptyArrays: true } },

            // peer profile
            { $lookup: { from: 'profiles', localField: 'peerPart.userId', foreignField: '_id', as: 'peer' } },
            { $unwind: { path: '$peer', preserveNullAndEmptyArrays: true } },

            // last message
            { $lookup: { from: 'messages', localField: 'chat.lastMessageId', foreignField: '_id', as: 'lastMsg' } },
            { $unwind: { path: '$lastMsg', preserveNullAndEmptyArrays: true } },

            // unread count since my lastReadAt
            {
                $lookup: {
                    from: 'messages',
                    let: { cid: '$chat._id', lastReadAt: '$lastReadAt' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$chatId', '$$cid'] },
                                        { $gt: ['$createdAt', { $ifNull: ['$$lastReadAt', new Date(0)] }] }
                                    ]
                                }
                            }
                        },
                        { $count: 'cnt' }
                    ],
                    as: 'unreads'
                }
            },
            { $addFields: { unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreads.cnt', 0] }, 0] } } },

            {
                $project: {
                    _id: '$chat._id',
                    lastMessageAt: '$chat.lastMessageAt',
                    unreadCount: 1,
                    peer: {
                        _id: '$peer._id',
                        name: '$peer.name',
                        email: '$peer.email',
                        avatarUrl: '$peer.avatarUrl',
                    },
                    lastMessage: {
                        _id: '$lastMsg._id',
                        type: '$lastMsg.type',
                        content: '$lastMsg.content',
                        createdAt: '$lastMsg.createdAt',
                        senderId: '$lastMsg.senderId',
                    },
                }
            },

            { $sort: { lastMessageAt: -1, _id: -1 } },
        ]);

        const items = rows.map(r => ({
            _id: String(r._id),
            lastMessageAt: r.lastMessageAt,
            unreadCount: r.unreadCount || 0,
            peer: r.peer ? {
                _id: r.peer?._id ? String(r.peer._id) : null,
                name: r.peer?.name || r.peer?.email || 'User',
                avatarUrl: r.peer?.avatarUrl || null,
            } : null,
            lastMessage: r.lastMessage ? {
                _id: r.lastMessage?._id ? String(r.lastMessage._id) : null,
                type: r.lastMessage?.type,
                content: r.lastMessage?.content,
                createdAt: r.lastMessage?.createdAt,
                senderId: r.lastMessage?.senderId ? String(r.lastMessage.senderId) : null,
            } : null,
        }));

        res.json({ items });
    } catch (e) {
        console.error('me/chats error:', e);
        res.status(500).json({ error: 'internal_error' });
    }
});

/** Messages history (newest→oldest; your client reverses) */
router.get('/chats/:id/messages', supabaseAuth, async (req, res) => {
    try {
        const chatId = toOid(req.params.id);
        const me = toOid(req.user.id);

        const part = await Participant.findOne({ chatId, userId: me });
        if (!part) return res.status(403).json({ error: 'forbidden' });

        const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);

        // cursor support
        const cursorTs = req.query.cursorTs ? new Date(Number(req.query.cursorTs)) : null;
        const cursorId = req.query.cursorId && Types.ObjectId.isValid(req.query.cursorId)
            ? new Types.ObjectId(req.query.cursorId) : null;

        const q = { chatId };
        if (cursorTs && cursorId) {
            q.$or = [
                { createdAt: { $lt: cursorTs } },
                { createdAt: cursorTs, _id: { $lt: cursorId } },
            ];
        }

        const items = await Message.find(q).sort({ createdAt: -1, _id: -1 }).limit(limit + 1);

        let nextCursor = null;
        if (items.length > limit) {
            const last = items[limit - 1];
            nextCursor = { ts: last.createdAt.getTime(), id: String(last._id) };
        }

        res.json({
            items: items.slice(0, limit).map((m) => {
                const o = m.toObject();
                return {
                    ...o,
                    _id: String(o._id),
                    chatId: String(o.chatId),
                    senderId: String(o.senderId),
                };
            }),
            nextCursor,
        });
    } catch (e) {
        if (e.message === 'invalid_objectid') return res.status(400).json({ error: 'invalid id format' });
        console.error('get messages error:', e);
        res.status(500).json({ error: 'internal_error' });
    }
});

/** Send message (REST). Change stream will broadcast to the room. */
router.post('/chats/:id/messages', supabaseAuth, async (req, res) => {
    try {
        const chatId = toOid(req.params.id);
        const sender = toOid(req.user.id);

        const part = await Participant.findOne({ chatId, userId: sender });
        if (!part) return res.status(403).json({ error: 'forbidden' });

        const type = (req.body?.type === 'image') ? 'image' : 'text';
        const content = req.body?.content || {};
        const now = new Date();

        const doc = await Message.create({
            chatId, senderId: sender, role: 'user', type, content,
            createdAt: now, editedAt: null, deletedAt: null,
        });

        await Chat.updateOne(
            { _id: chatId },
            { $set: { lastMessageAt: now, lastMessageId: doc._id } }
        );

        const o = doc.toObject();
        res.json({
            ...o,
            _id: String(o._id),
            chatId: String(o.chatId),
            senderId: String(o.senderId),
        });
    } catch (e) {
        if (e.message === 'invalid_objectid') return res.status(400).json({ error: 'invalid id format' });
        console.error('send message error:', e);
        res.status(500).json({ error: 'internal_error' });
    }
});

module.exports = router;
