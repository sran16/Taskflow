import { z } from 'zod'
import { civilDateSchema } from './habitValidators.js'

function isValidTimeZone(value) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch (error) {
    if (error instanceof RangeError) return false
    throw error
  }
}

function dayNumber(date) {
  return Date.parse(`${date}T00:00:00.000Z`) / (24 * 60 * 60 * 1000)
}

export const heatmapQuerySchema = z
  .object({
    from: civilDateSchema.optional(),
    to: civilDateSchema.optional(),
    timezone: z.string().min(1).max(100).refine(isValidTimeZone, 'Fuseau horaire IANA invalide').default('UTC'),
  })
  .strict()
  .refine(({ from, to }) => (from === undefined) === (to === undefined), {
    message: 'Les paramètres "from" et "to" doivent être fournis ensemble',
  })
  .refine(({ from, to }) => !from || dayNumber(to) - dayNumber(from) <= 365, {
    message: "La période ne peut pas dépasser 366 jours (plus d'1 an)",
  })
  .refine(({ from, to }) => !from || from <= to, {
    message: 'La date from doit être antérieure ou égale à "to"',
  })
