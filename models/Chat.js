// models/Chat.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ChatSchema = new Schema(
  {
    // unique key for (sorted userIds + petId) if you use it
    key: { type: String, unique: true, index: true },
    petId: { type: Schema.Types.ObjectId, ref: 'pets', default: null },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
