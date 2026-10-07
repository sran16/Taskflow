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
  addHabitDate,
  removeHabitDate,
} from '../controllers/habitController.js'
import {
  createHabitSchema,
  updateHabitSchema,
  createHabitEventSchema,
} from '../validators/habitValidators.js'

///////////////////////////////////////////////////////

const router = Router()

router.use(requireAuth)

router.get('/', listHabits)
router.post('/', validate(createHabitSchema), createHabit)
router.get('/:id', getHabit)
router.patch('/:id', validate(updateHabitSchema), updateHabit)
router.delete('/:id', deleteHabit)

// Realizations (dates are stored inside the habit)
router.post('/:id/events', validate(createHabitEventSchema), addHabitDate)
router.delete('/:id/events/:date', removeHabitDate)

export default router
