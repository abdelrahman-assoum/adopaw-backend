// models/Participant.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ParticipantSchema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'chats', index: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'users', index: true, required: true },
    role:   { type: String, enum: ['owner', 'adopter'], default: 'adopter' },
    lastReadAt: { type: Date, default: new Date(0) },
  },
  { timestamps: true }
);

// one row per (chat,user)
ParticipantSchema.index({ chatId: 1, userId: 1 }, { unique: true });

module.exports =
  mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);
