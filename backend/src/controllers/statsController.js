import { getWeeklyStats } from '../services/statsService.js'
import { sendError } from '../utils/errors.js'

// GET /api/stats/weekly?weeks=8
export async function weeklyStats(req, res) {
  try {
    const weeks = req.validatedQuery.weeks ?? 8
    const items = await getWeeklyStats(req.user._id, weeks)
    return res.json({ items })
  } catch (error) {
    console.error('Erreur Stats:', error)
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors du calcul des statistiques')
  }
}
