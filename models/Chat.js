const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  lastMessageAt: { type: Date, default: null },
  lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
}, { timestamps: true, collection: 'chats' });

ChatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
