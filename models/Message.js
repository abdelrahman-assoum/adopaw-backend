const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  senderId: { type: String, required: true },              // Supabase UUID (string)
  role: { type: String, enum: ['user','assistant','system'], default: 'user' },
  type: { type: String, enum: ['text','image','file'], default: 'text' },
  content: { type: Object, default: {} },                  // { text } or { imageUrl, ... }
  clientId: { type: String, default: null },               // for optimistic reconciliation
  createdAt: { type: Date, default: Date.now, index: true },
  editedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
}, { collection: 'messages' });

MessageSchema.index({ chatId: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
