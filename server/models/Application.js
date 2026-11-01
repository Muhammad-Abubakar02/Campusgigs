const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverNote: { type: String, trim: true, default: '' },
    proposedPrice: { type: Number, min: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

// One application per user per gig
applicationSchema.index({ gig: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
