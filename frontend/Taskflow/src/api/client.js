// Base URL of the API: comes from .env (VITE_API_URL), with a local fallback.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// Small fetch wrapper: JSON headers, optional Bearer token, throws on error.
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Always hit the API: never serve a stale cached response (Express sends ETags).
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Erreur')
  }

  return data
}
