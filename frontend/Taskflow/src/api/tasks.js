import { apiFetch } from './client.js'

export async function listTasks(token, filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom)
  if (filters.dueDateTo) params.set('dueDateTo', filters.dueDateTo)

  const query = params.toString()
  const data = await apiFetch(`/tasks${query ? `?${query}` : ''}`, { token })
  return data.items
}

export function countTasks(token) {
  return apiFetch('/tasks/count', { token })
}

export function createTask(token, task) {
  return apiFetch('/tasks', { method: 'POST', body: task, token })
}

export function updateTask(token, id, patch) {
  return apiFetch(`/tasks/${id}`, { method: 'PATCH', body: patch, token })
}

export function deleteTask(token, id) {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE', token })
}
