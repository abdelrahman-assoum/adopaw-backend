// models/Message.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    chatId:  { type: Schema.Types.ObjectId, ref: 'chats', index: true, required: true },
    senderId:{ type: Schema.Types.ObjectId, ref: 'users', index: true, required: true },
    role:    { type: String, default: 'user' },
    type:    { type: String, enum: ['text', 'image'], default: 'text' },
    content: {
      text: String,
      imageUrl: String,
    },
    clientId: { type: String, default: null },
    createdAt:{ type: Date, default: Date.now },
    editedAt: { type: Date, default: null },
    deletedAt:{ type: Date, default: null },
  },
  { timestamps: false }
);

module.exports =
  mongoose.models.Message || mongoose.model('Message', MessageSchema);
