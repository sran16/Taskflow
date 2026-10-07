import { apiFetch } from './client.js'

export function getHeatmap(token, { from, to, timezone } = {}) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (timezone) params.set('timezone', timezone)

  const query = params.toString()
  return apiFetch(`/heatmap${query ? `?${query}` : ''}`, { token })
}
