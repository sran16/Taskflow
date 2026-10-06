import mongoose from 'mongoose'

// A habit is a recurring action (daily or weekly), owned by a user.
// It is NOT a one-off task: its dated realizations live in HabitEvent.
const habitSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    frequency: { type: String, required: true, enum: ['daily', 'weekly'] },
    active: { type: Boolean, required: true },
  },
  { timestamps: true }
)

habitSchema.index({ ownerId: 1, createdAt: -1 })

export const Habit = mongoose.model('Habit', habitSchema)
