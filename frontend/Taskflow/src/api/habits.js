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

// Mark a realization for a date (returns the updated habit with its dates)
export function addHabitDate(token, id, date) {
  return apiFetch(`/habits/${id}/events`, { method: 'POST', body: { date }, token })
}

// Unmark a realization (returns the updated habit)
export function removeHabitDate(token, id, date) {
  return apiFetch(`/habits/${id}/events/${date}`, { method: 'DELETE', token })
}
