import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { sendError } from '../utils/errors.js'

// Creates a token for a user.
function createToken(user) {
  return jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

// Never send the password back to the client.
function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
  }
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      return sendError(res, 409, 'EMAIL_ALREADY_USED', 'Cet email est déjà utilisé')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ email, password: hashedPassword })

    return res.status(201).json({
      user: publicUser(user),
      token: createToken(user),
    })
  } catch (error) {
    // Duplicate key from the unique email index
    if (error.code === 11000) {
      return sendError(res, 409, 'EMAIL_ALREADY_USED', 'Cet email est déjà utilisé')
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de l’inscription')
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Email ou mot de passe incorrect')
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Email ou mot de passe incorrect')
    }

    return res.json({
      user: publicUser(user),
      token: createToken(user),
    })
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la connexion')
  }
}

// GET /api/auth/me (protected)
export async function me(req, res) {
  return res.json({ user: publicUser(req.user) })
}
