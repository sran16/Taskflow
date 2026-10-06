import { z } from 'zod'

export const weeklyQuerySchema = z
  .object({
    weeks: z.coerce
      .number()
      .int('weeks doit être un entier')
      .min(1, 'weeks doit être entre 1 et 52')
      .max(52, 'weeks doit être entre 1 et 52')
      .optional(),
  })
  .strict()
