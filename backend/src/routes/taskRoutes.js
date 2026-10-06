import { Router } from 'express'

//auth
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

//tasks
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController.js'
import { createTaskSchema, updateTaskSchema } from '../validators/taskValidators.js'

///////////////////////////////////////////////////////

const router = Router()

router.use(requireAuth)
router.get('/', listTasks)
router.post('/', validate(createTaskSchema), createTask)
router.get('/:id', getTask)
router.patch('/:id', validate(updateTaskSchema), updateTask)
router.delete('/:id', deleteTask)

export default router