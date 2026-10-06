import { Router } from 'express'
import authRoutes from './authRoutes.js'
import taskRoutes from './taskRoutes.js'
import habitRoutes from './habitRoutes.js'

const router = Router()

// Health check (public)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

router.use('/auth', authRoutes)
router.use('/tasks', taskRoutes)
router.use('/habits', habitRoutes)

export default router
