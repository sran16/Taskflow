// Local civil date as YYYY-MM-DD
export function todayCivil() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}


export function lastNDays(n) {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  const days = []
  for (let i = n - 1; i >= 0; i -= 1) {
    days.push(new Date(now.getTime() - offset - i * 86400000).toISOString().slice(0, 10))
  }
  return days
}

export function dayLabel(civil) {
  const [year, month, day] = civil.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
}
