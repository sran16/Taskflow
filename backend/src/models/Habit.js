import mongoose from 'mongoose'

// A habit is a recurring action (daily or weekly).
// Its realizations are a simple array of civil dates ('YYYY-MM-DD') stored
// directly in the habit document: no separate collection.
const habitSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    frequency: { type: String, required: true, enum: ['daily', 'weekly'] },
    active: { type: Boolean, required: true },
    dates: { type: [String], default: [] },
  },
  { timestamps: true }
)

habitSchema.index({ ownerId: 1, createdAt: -1 })

export const Habit = mongoose.model('Habit', habitSchema)
