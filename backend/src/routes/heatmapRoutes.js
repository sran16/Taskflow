import { Router } from 'express'
import { getHeatmap } from '../controllers/heatmapController.js'
import { requireAuth } from '../middleware/auth.js'
import { validateQuery } from '../middleware/validate.js'
import { heatmapQuerySchema } from '../validators/heatmapValidators.js'

const router = Router()

router.get('/', requireAuth, validateQuery(heatmapQuerySchema), getHeatmap)

export default router
