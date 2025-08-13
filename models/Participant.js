const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: String, required: true, index: true }, // Supabase UUID as STRING
  joinedAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date, default: new Date(0) },
}, { collection: 'participants' });

ParticipantSchema.index({ chatId: 1, userId: 1 }, { unique: true });
ParticipantSchema.index({ userId: 1, joinedAt: -1 });

module.exports = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);
