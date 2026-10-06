import { Router } from 'express'

// auth
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

// habits
import {
  listHabits,
  createHabit,
  getHabit,
  updateHabit,
  deleteHabit,
  listHabitEvents,
  createHabitEvent,
  deleteHabitEvent,
} from '../controllers/habitController.js'
import {
  createHabitSchema,
  updateHabitSchema,
  createHabitEventSchema,
} from '../validators/habitValidators.js'

///////////////////////////////////////////////////////

const router = Router()

router.use(requireAuth)

// Required CRUD (contract 4.4)
router.get('/', listHabits)
router.post('/', validate(createHabitSchema), createHabit)
router.get('/:id', getHabit)
router.patch('/:id', validate(updateHabitSchema), updateHabit)
router.delete('/:id', deleteHabit)

// Bonus B2: dated realizations
router.get('/:id/events', listHabitEvents)
router.post('/:id/events', validate(createHabitEventSchema), createHabitEvent)
router.delete('/:id/events/:date', deleteHabitEvent)

export default router
