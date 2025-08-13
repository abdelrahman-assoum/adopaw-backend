const mongoose = require('mongoose');

const ReadReceiptSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  messageId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: String, required: true, index: true }, // Supabase UUID (string)
  readAt: { type: Date, default: Date.now },
}, { collection: 'read_receipts' });

ReadReceiptSchema.index({ chatId: 1, messageId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.ReadReceipt || mongoose.model('ReadReceipt', ReadReceiptSchema);
