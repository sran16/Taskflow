import { HabitEvent } from '../models/HabitEvent.js'
import { Task } from '../models/Task.js'
import { sendError } from '../utils/errors.js'
import { buildCalendarWeeks, buildHeatmapDays, heatmapLegend, resolveHeatmapRange } from '../utils/heatmap.js'

// bonus 3, heatmap type github :)

export async function getHeatmap(req, res) {
  const range = resolveHeatmapRange(req.validatedQuery)
  const fromDay = Date.parse(`${range.from}T00:00:00.000Z`)
  const toDay = Date.parse(`${range.to}T00:00:00.000Z`)
  if (fromDay > toDay || toDay - fromDay > 365 * 24 * 60 * 60 * 1000) return sendError(res, 400, 'INVALID_INPUT', 'Période de heatmap invalide (366 jours maximum)');

  try {
    const [taskCounts, habitCounts] = await Promise.all([
      Task.aggregate([  // mongodb
        { $match: { user: req.user._id, status: 'done', completedAt: { $type: 'date' } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$completedAt',
                timezone: range.timezone,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $gte: range.from, $lte: range.to } } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]),
      HabitEvent.dailyCounts(req.user._id, range.from, range.to),
    ])
    const days = buildHeatmapDays(range.from, range.to, taskCounts, habitCounts)
    const total = days.reduce((sum, day) => sum + day.count, 0)

    return res.json({
      from: range.from,
      to: range.to,
      timezone: range.timezone,
      total,
      legend: heatmapLegend,
      weeks: buildCalendarWeeks(days),
    })
  } catch (error) {console.error('Erreur Heatmap:', error)
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la génération heatmap')
  }
}
