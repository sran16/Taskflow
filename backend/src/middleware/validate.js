import { sendError } from '../utils/errors.js'

// Checks that the request body matches a Zod schema.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const first = result.error.issues[0]
      return sendError(res, 400, 'INVALID_INPUT', first ? first.message : 'Données invalides')
    }

    req.body = result.data
    next()
  }
}
