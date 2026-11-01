const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true, min: 0 },
    tags: [{ type: String, lowercase: true, trim: true }], // e.g. design, video-editing, notes
    status: { type: String, enum: ['open', 'in-progress', 'completed'], default: 'open' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date },
  },
  { timestamps: true }
);

gigSchema.index({ tags: 1 });
gigSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
