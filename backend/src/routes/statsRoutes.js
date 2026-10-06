import { Router } from 'express'

// auth
import { requireAuth } from '../middleware/auth.js'
import { validateQuery } from '../middleware/validate.js'

// stats (bonus B4)
import { weeklyStats } from '../controllers/statsController.js'
import { weeklyQuerySchema } from '../validators/statsValidators.js'

///////////////////////////////////////////////////////

const router = Router()

router.use(requireAuth)

router.get('/weekly', validateQuery(weeklyQuerySchema), weeklyStats)

export default router
