import { apiFetch } from './client.js'

export async function listTasks(token) {
  const data = await apiFetch('/tasks', { token })
  return data.items
}

export function createTask(token, task) {
  return apiFetch('/tasks', { method: 'POST', body: task, token })
}