import mongoose from 'mongoose'

// One dated realization of a habit (e.g. "Marcher" done on 2026-10-05).
// A habit has many events over time: this is what makes it recurring.
//
// For the B3 heatmap: aggregate these events by `date` for a given `ownerId`.
// A ready-to-use helper is provided below: HabitEvent.dailyCounts(ownerId, from, to).
const habitEventSchema = new mongoose.Schema(
  {
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // civil date, format YYYY-MM-DD
  },
  { timestamps: true }
)

// One realization per habit per day.
habitEventSchema.index({ habitId: 1, date: 1 }, { unique: true })
// Fast daily aggregation for the B3 heatmap.
habitEventSchema.index({ ownerId: 1, date: 1 })

// Daily counts of habit realizations, for the B3 heatmap.
// Returns [{ date: 'YYYY-MM-DD', count: n }, ...] sorted by date.
// `from` and `to` are optional inclusive bounds (YYYY-MM-DD).
habitEventSchema.statics.dailyCounts = async function (ownerId, from, to) {
  const match = { ownerId }
  if (from || to) {
    match.date = {}
    if (from) match.date.$gte = from
    if (to) match.date.$lte = to
  }

  return this.aggregate([
    { $match: match },
    { $group: { _id: '$date', count: { $sum: 1 } } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
    { $sort: { date: 1 } },
  ])
}

export const HabitEvent = mongoose.model('HabitEvent', habitEventSchema)
