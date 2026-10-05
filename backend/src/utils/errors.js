// Common error shape for the API: { error: { code, message } }
export function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } })
}
