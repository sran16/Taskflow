import { Router } from 'express'
import authRoutes from './authRoutes.js'
import taskRoutes from './taskRoutes.js'

const router = Router()

// Health check (public)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

router.use('/auth', authRoutes)
router.use('/tasks', taskRoutes)

export default router
