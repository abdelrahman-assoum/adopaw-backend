// realtime/streams.js
const { getDb } = require("./utilsDb");

async function buildUnread(db, chatId, userId) {
  const me = await db.collection("participants").findOne({ chatId, userId });
  return db.collection("messages").countDocuments({
    chatId,
    createdAt: { $gt: me?.lastReadAt || new Date(0) },
  });
}

module.exports.wireStreams = async function wireStreams(io) {
  const db = await getDb();

  // --- messages stream (insert only)
  const msgStream = db
    .collection("messages")
    .watch([{ $match: { operationType: "insert" } }], {
      fullDocument: "updateLookup",
    });

  msgStream.on("change", async (ev) => {
    const m = ev.fullDocument;
    const chatId = String(m.chatId);
    const senderId = String(m.senderId);
    const msgId = String(m._id);

    // 1) push the new message to the chat room (detail view listeners)
    io.to(`chat:${chatId}`).emit(`message:new:${chatId}`, {
      ...m,
      _id: msgId,
      chatId,
      senderId,
    });

    // 2) nudge each participant's user room so their chat list updates
    const parts = await db
      .collection("participants")
      .find({ chatId: m.chatId })
      .project({ userId: 1 })
      .toArray();

    const last = {
      _id: msgId,
      type: m.type,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      senderId,
    };

    for (const p of parts) {
      const userRoom = `user:${String(p.userId)}`;
      const unreadCount = await buildUnread(db, m.chatId, p.userId);

      // keep your existing event
      io.to(userRoom).emit("chat:list:update", {
        type: "upsert",
        chat: {
          _id: chatId,
          lastMessageAt: m.createdAt,
          lastMessage: last,
          unreadCount,
        },
      });

      // also emit a lightweight "touch" for clients that just refetch
      io.to(userRoom).emit("chat:touch", {
        chatId,
        lastMessageAt: m.createdAt,
        lastMessageId: msgId,
      });
    }
  });

  msgStream.on("error", (e) => console.error("Message stream error:", e));

  // --- chats stream: notify when a chat is created
  const chatStream = db
    .collection("chats")
    .watch([{ $match: { operationType: "insert" } }], {
      fullDocument: "updateLookup",
    });

  chatStream.on("change", async (ev) => {
    const chat = ev.fullDocument;
    const chatId = String(chat._id);

    const parts = await db
      .collection("participants")
      .find({ chatId: chat._id })
      .project({ userId: 1 })
      .toArray();

    for (const p of parts) {
      const userRoom = `user:${String(p.userId)}`;
      io.to(userRoom).emit("chat:new", {
        chatId,
        chat: { ...chat, _id: chatId },
      });
    }
  });

  chatStream.on("error", (e) => console.error("Chat stream error:", e));
};
