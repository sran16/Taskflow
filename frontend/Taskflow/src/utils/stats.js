// Statistics computed on the client from the tasks and habits already loaded.

function civil(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function addDays(date, days) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + days)
  return d
}

// Monday (local) of the week containing `date`.
function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function round(value) {
  return Math.round(value * 1000) / 1000
}

function ratio(done, total) {
  return total === 0 ? 0 : round(done / total)
}

// ---------- heatmap ----------

export function heatmapLevel(count) {
  if (!count) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

// One entry per day: number of completed tasks + habit realizations.
export function computeHeatmap(tasks, habits, days) {
  const counts = {}

  for (const task of tasks) {
    if (task.completedAt) {
      const date = civil(task.completedAt)
      counts[date] = (counts[date] || 0) + 1
    }
  }
  for (const habit of habits) {
    for (const date of habit.dates || []) {
      counts[date] = (counts[date] || 0) + 1
    }
  }

  return days.map((date) => {
    const count = counts[date] || 0
    return { date, count, level: heatmapLevel(count) }
  })
}

// Group days into weeks of 7 (Sunday first) so the grid aligns.
export function buildWeeks(days) {
  if (days.length === 0) return []

  const first = new Date(`${days[0].date}T00:00:00Z`)
  const cells = [...Array(first.getUTCDay()).fill(null), ...days]
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const last = weeks[weeks.length - 1]
  while (last.length < 7) last.push(null)
  return weeks
}

// ---------- weekly completion rates ----------

function taskRate(tasks, start, end) {
  const startDate = civil(start)
  const endDate = civil(end)
  let open = 0
  let completed = 0

  for (const task of tasks) {
    const created = civil(task.createdAt)
    const done = task.completedAt ? civil(task.completedAt) : null

    if (created && created < endDate && (!done || done >= startDate)) open += 1
    if (done && done >= startDate && done < endDate) completed += 1
  }

  return { completed, open, rate: ratio(completed, open) }
}

function habitRate(habits, start, end) {
  const startDate = civil(start)
  const endDate = civil(addDays(end, -1))
  let done = 0
  let expected = 0

  for (const habit of habits) {
    if (!habit.active) continue

    const expectedForHabit = habit.frequency === 'daily' ? 7 : 1
    const count = (habit.dates || []).filter((date) => date >= startDate && date <= endDate).length

    expected += expectedForHabit
    done += Math.min(count, expectedForHabit)
  }

  return { done, expected, rate: ratio(done, expected) }
}

export function computeWeeklyStats(tasks, habits, weeks = 8, referenceDate = new Date()) {
  const currentStart = startOfWeek(referenceDate)
  const items = []

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = addDays(currentStart, -7 * i)
    const end = addDays(start, 7)
    items.push({
      weekStart: civil(start),
      weekEnd: civil(addDays(end, -1)),
      tasks: taskRate(tasks, start, end),
      habits: habitRate(habits, start, end),
    })
  }

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
