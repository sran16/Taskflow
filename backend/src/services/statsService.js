import { Task } from '../models/Task.js'
import { Habit } from '../models/Habit.js'
import { HabitEvent } from '../models/HabitEvent.js'

// ---------------------------------------------------------------------------
// B4 - Statistics
//
// Weekly completion rates, Monday to Sunday (ISO weeks), computed in UTC.
//
// TASK completion rate of a week:
//   rate = completed / open
//   - open      = tasks that were still open at some point during the week
//                 (created before the end of the week AND not already completed
//                  before the start of the week)
//   - completed = tasks whose completedAt falls inside the week
//   (a completed task is always part of "open", so the rate stays between 0 and 1)
//
// HABIT completion rate of a week:
//   rate = done / expected
//   - expected = sum over active habits: 7 days for a "daily" habit, 1 for a "weekly"
//   - done     = sum over active habits of min(days realized, expected)
//   (an event is one realization for a given day, so "days realized" = number of events)
//
// "evolution" is the difference of rate compared to the previous week.
// ---------------------------------------------------------------------------

// ---------- pure date helpers (UTC) ----------

export function civilDate(date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(date, days) {
  const d = new Date(date.getTime())
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

// Monday 00:00 UTC of the ISO week containing `date`.
export function startOfIsoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function round(value) {
  return Math.round(value * 1000) / 1000
}

function rate(done, total) {
  return total === 0 ? 0 : round(done / total)
}

// ---------- aggregations ----------

export async function taskStatsForRange(ownerId, start, end) {
  const open = await Task.countDocuments({
    user: ownerId,
    createdAt: { $lt: end },
    $or: [{ completedAt: null }, { completedAt: { $gte: start } }],
  })

  const completed = await Task.countDocuments({
    user: ownerId,
    completedAt: { $gte: start, $lt: end },
  })

  return { completed, open, rate: rate(completed, open) }
}

export async function habitStatsForRange(ownerId, start, end) {
  const habits = await Habit.find({ ownerId, active: true })
  if (habits.length === 0) return { done: 0, expected: 0, rate: 0 }

  const startDate = civilDate(start)
  const endDate = civilDate(addDays(end, -1)) // inclusive last day (Sunday)

  const grouped = await HabitEvent.aggregate([
    { $match: { ownerId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$habitId', days: { $sum: 1 } } },
  ])
  const daysByHabit = new Map(grouped.map((group) => [String(group._id), group.days]))

  let done = 0
  let expected = 0
  for (const habit of habits) {
    const expectedForHabit = habit.frequency === 'daily' ? 7 : 1
    const days = daysByHabit.get(String(habit._id)) || 0
    expected += expectedForHabit
    done += Math.min(days, expectedForHabit)
  }

  return { done, expected, rate: rate(done, expected) }
}

// Weekly stats for the last `weeks` weeks (most recent week last).
export async function getWeeklyStats(ownerId, weeks = 8, referenceDate = new Date()) {
  const currentStart = startOfIsoWeek(referenceDate)
  const items = []

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = addDays(currentStart, -7 * i)
    const end = addDays(start, 7)

    items.push({
      weekStart: civilDate(start),
      weekEnd: civilDate(addDays(end, -1)),
      tasks: await taskStatsForRange(ownerId, start, end),
      habits: await habitStatsForRange(ownerId, start, end),
    })
  }

  // Evolution: difference vs the previous week (null for the first week).
  return items.map((item, index) => {
    const previous = items[index - 1]
    return {
      ...item,
      evolution: {
        tasks: previous ? round(item.tasks.rate - previous.tasks.rate) : null,
        habits: previous ? round(item.habits.rate - previous.habits.rate) : null,
      },
    }
  })
}
