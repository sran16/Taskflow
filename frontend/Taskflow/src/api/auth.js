import { apiFetch } from './client.js'

// POST /api/auth/login -> returns the JWT token
export async function login(email, password) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } })
  return data.token
}

// POST /api/auth/register -> returns the JWT token
export async function register(email, password) {
  const data = await apiFetch('/auth/register', { method: 'POST', body: { email, password } })
  return data.token
}
