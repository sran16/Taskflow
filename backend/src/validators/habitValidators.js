import { z } from 'zod'

const titleSchema = z.string().trim().min(1, 'Le titre ne peut pas être vide').max(120, 'Le titre ne peut pas dépasser 120 caractères')

const frequencySchema = z.enum(['daily', 'weekly'], {
  errorMap: () => ({ message: 'La fréquence doit être daily ou weekly' }),
})

const activeSchema = z.boolean({
  required_error: 'active est requis',
  invalid_type_error: 'active doit être un booléen',
})

// Real civil date: YYYY-MM-DD, and the day must exist in that month.
export const civilDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit respecter le format YYYY-MM-DD')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    if (year < 1 || month < 1 || month > 12) return false

    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return day >= 1 && day <= daysInMonth[month - 1]
  }, 'La date doit être une date civile réelle')

export const createHabitSchema = z
  .object({
    title: titleSchema,
    frequency: frequencySchema,
    active: activeSchema,
  })
  .strict()

export const updateHabitSchema = z
  .object({
    title: titleSchema.optional(),
    frequency: frequencySchema.optional(),
    active: activeSchema.optional(),
  })
  .strict()
  .refine((habit) => Object.keys(habit).length > 0, { message: 'Au moins un champ doit être fourni' })

export const createHabitEventSchema = z
  .object({
    date: civilDateSchema,
  })
  .strict()
