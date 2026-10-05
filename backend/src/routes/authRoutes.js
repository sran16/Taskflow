import { Router } from 'express'
import { register, login, me } from '../controllers/authController.js'
import { registerSchema, loginSchema } from '../validators/authValidators.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', requireAuth, me)

export default router
