import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { sendError } from '../utils/errors.js'

// Verifies the JWT and puts the user in req.user.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Token manquant')
    }

    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(payload.id)

    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Utilisateur introuvable')
    }

    req.user = user
    next()
  } catch {
    return sendError(res, 401, 'UNAUTHORIZED', 'Token invalide ou expiré')
  }
}
