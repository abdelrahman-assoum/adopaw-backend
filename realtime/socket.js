// realtime/socket.js
const { oid, getDb } = require("./utilsDb");

module.exports = function registerSocket(io) {
  io.on("connection", async (socket) => {
    try {
      const userIdStr = String(socket.userId || "");
      if (!/^[a-f0-9]{24}$/i.test(userIdStr)) {
        console.error("[ws] bad userId (not ObjectId):", userIdStr);
        socket.disconnect(true);
        return;
      }
      const userId = oid(userIdStr);
      const userRoom = `user:${userIdStr}`;
      socket.join(userRoom);
      // console.log("[ws] connected", { userId: userIdStr });

      socket.on("chat:join", ({ chatId }) => {
        if (!chatId) return;
        socket.join(`chat:${String(chatId)}`);
      });

      socket.on("chat:leave", ({ chatId }) => {
        if (!chatId) return;
        socket.leave(`chat:${String(chatId)}`);
      });

      socket.on("typing", ({ chatId, isTyping }) => {
        if (!chatId) return;
        const room = `chat:${String(chatId)}`;
        socket.to(room).emit(`typing:${String(chatId)}`, {
          chatId: String(chatId),
          userId: userIdStr,
          isTyping: !!isTyping,
          at: Date.now(),
        });
      });

      socket.on("message:send", async (payload, cb) => {
        try {
          const db = await getDb();
          const chatId = oid(payload.chatId);

          const part = await db
            .collection("participants")
            .findOne({ chatId, userId });
          if (!part) return cb?.({ ok: false, error: "forbidden" });

          const doc = {
            chatId,
            senderId: userId,
            role: "user",
            type: payload.type,
            content: payload.content || {},
            clientId: payload.clientId || null,
            createdAt: new Date(),
            editedAt: null,
            deletedAt: null,
          };

          const { insertedId } = await db.collection("messages").insertOne(doc);
          await db
            .collection("chats")
            .updateOne(
              { _id: chatId },
              {
                $set: {
                  lastMessageAt: doc.createdAt,
                  lastMessageId: insertedId,
                },
              }
            );

          cb?.({ ok: true, _id: String(insertedId) });
          // broadcast handled by streams.js
        } catch (e) {
          cb?.({ ok: false, error: e.message });
        }
      });

      socket.on("read", async ({ chatId, messageId }) => {
        if (!chatId || !messageId) return;
        const db = await getDb();
        const cId = oid(chatId),
          mId = oid(messageId);

        const part = await db
          .collection("participants")
          .findOne({ chatId: cId, userId });
        if (!part) return;

        await db
          .collection("participants")
          .updateOne(
            { chatId: cId, userId },
            { $set: { lastReadAt: new Date() } }
          );

        await db
          .collection("read_receipts")
          .updateOne(
            { chatId: cId, messageId: mId, userId },
            { $set: { readAt: new Date() } },
            { upsert: true }
          );

        // echo to chat room (other participants see who read)
        const chatKey = String(chatId);
        io.to(`chat:${chatKey}`).emit(`message:read:${chatKey}`, {
          chatId: chatKey,
          messageId: String(messageId),
          userId: userIdStr,
          readAt: Date.now(),
        });

        // NEW: tell THIS user's list to clear unread instantly across sessions
        io.to(`user:${userIdStr}`).emit("chat:list:update", {
          type: "upsert",
          chat: { _id: chatKey, unreadCount: 0 },
        });
      });
    } catch (err) {
      console.error("[ws] connection handler error:", err.message);
      socket.disconnect(true);
    }
  });
};
