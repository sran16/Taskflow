import { apiFetch } from './client.js'

export async function listHabits(token) {
  const data = await apiFetch('/habits', { token })
  return data.items
}

export function createHabit(token, habit) {
  return apiFetch('/habits', { method: 'POST', body: habit, token })
}

export function updateHabit(token, id, patch) {
  return apiFetch(`/habits/${id}`, { method: 'PATCH', body: patch, token })
}

export function deleteHabit(token, id) {
  return apiFetch(`/habits/${id}`, { method: 'DELETE', token })
}

export async function listHabitEvents(token, id) {
  const data = await apiFetch(`/habits/${id}/events`, { token })
  return data.items
}

export function addHabitEvent(token, id, date) {
  return apiFetch(`/habits/${id}/events`, { method: 'POST', body: { date }, token })
}

export function removeHabitEvent(token, id, date) {
  return apiFetch(`/habits/${id}/events/${date}`, { method: 'DELETE', token })
}
