const DAY_MS = 24 * 60 * 60 * 1000

export const heatmapLegend = [
  { level: 0, label: '0 réalisations' },
  { level: 1, label: '1 réalisation' },
  { level: 2, label: '2 à 3 réalisations' },
  { level: 3, label: '4 à 6 réalisations' },
  { level: 4, label: '7 réalisations ou plus' },
]

function formatCivilDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year.padStart(4, '0')}-${values.month}-${values.day}`
}

function addDays(date, numberOfDays) {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + numberOfDays * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

export function resolveHeatmapRange({ from, to, timezone }, now = new Date()) {
  const end = to ?? formatCivilDate(now, timezone)
  const start = from ?? addDays(end, -364)
  return { from: start, to: end, timezone }
}

function getLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

export function buildHeatmapDays(from, to, taskCounts, habitCounts) {
  const countsByDate = new Map()

  for (const { date, count } of taskCounts) {
    countsByDate.set(date, { taskCount: count, habitCount: 0 })
  }
  for (const { date, count } of habitCounts) {
    const counts = countsByDate.get(date) ?? { taskCount: 0, habitCount: 0 }
    counts.habitCount = count
    countsByDate.set(date, counts)
  }

  const days = []
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const { taskCount = 0, habitCount = 0 } = countsByDate.get(date) ?? {}
    const count = taskCount + habitCount
    days.push({ date, taskCount, habitCount, count, level: getLevel(count) })
  }
  return days
}

export function buildCalendarWeeks(days) {
  if (days.length === 0) return []

  const firstDate = new Date(`${days[0].date}T00:00:00.000Z`)
  let weekStart = addDays(days[0].date, -firstDate.getUTCDay())
  const weeks = []
  let week = []

  for (let offset = 0; offset < firstDate.getUTCDay(); offset += 1) week.push(null)

  for (const day of days) {
    week.push(day)
    if (week.length === 7) {
      weeks.push({ weekStart, days: week })
      week = []
      weekStart = addDays(weekStart, 7)
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push({ weekStart, days: week })
  }

  return weeks
}
