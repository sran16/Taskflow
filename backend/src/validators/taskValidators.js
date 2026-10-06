import { z } from 'zod'

// zod

const titleSchema = z.string().trim().min(1, 'Le titre ne peut pas être vide').max(120, 'Le titre ne peut pas dépasser 120 caractères')
const descriptionSchema = z.string().max(1000, 'La description ne peut pas dépasser 1000 caractères')

const dueDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La date doit respecter le format YYYY-MM-DD').refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    if (year < 1 || month < 1 || month > 12) return false

    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return day >= 1 && day <= daysInMonth[month - 1]
  }, 'La date doit être une date civile réelle')

const statusSchema = z.enum(['todo', 'doing', 'done'], {errorMap: () => ({ message: 'Le statut doit être todo, doing ou done' })})
const prioritySchema = z.enum(['low', 'medium', 'high'], {errorMap: () => ({ message: 'La priorité doit être low, medium ou high' })})

const taskFields = {title: titleSchema, status: statusSchema,
  description: descriptionSchema.optional(),
  dueDate: dueDateSchema.nullable().optional(),
  priority: prioritySchema.optional() // bonus1 : priority
} 

export const createTaskSchema = z.object({
  title: taskFields.title,
  status: taskFields.status,
  description: taskFields.description,
  dueDate: taskFields.dueDate,
  priority: taskFields.priority,
}).strict()

export const updateTaskSchema = z.object(taskFields).partial().strict().refine((task) => Object.keys(task).length > 0, {message: 'Au moins un champ doit être fourni'})

export const taskFilterSchema = z.object({
  status: statusSchema.optional(),
  dueDate: z.union([dueDateSchema, z.literal('null')]).optional(),
  dueDateFrom: dueDateSchema.optional(),
  dueDateTo: dueDateSchema.optional(),
}).strict().refine((filters) => {
  const hasRange = filters.dueDateFrom !== undefined || filters.dueDateTo !== undefined
  if (filters.dueDate !== undefined && hasRange) return false
  if (filters.dueDateFrom && filters.dueDateTo) return filters.dueDateFrom <= filters.dueDateTo
  return true
}, { message: 'Utilisez soit dueDate, soit une plage de dates valide' })