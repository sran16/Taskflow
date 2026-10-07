import { apiFetch } from './client.js'

export async function getWeeklyStats(token, weeks = 8) {
  const data = await apiFetch(`/stats/weekly?weeks=${weeks}`, { token })
  return data.items
}
