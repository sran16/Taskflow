import { Router } from 'express'

//auth
import { requireAuth } from '../middleware/auth.js'
import { validate, validateQuery } from '../middleware/validate.js'

//tasks
import { countTasks, createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/taskController.js'
import { createTaskSchema, taskFilterSchema, updateTaskSchema } from '../validators/taskValidators.js'

///////////////////////////////////////////////////////

const router = Router()

router.use(requireAuth)
router.get('/count', validateQuery(taskFilterSchema), countTasks)
router.get('/', validateQuery(taskFilterSchema), listTasks)
router.post('/', validate(createTaskSchema), createTask)
router.get('/:id', getTask)
router.patch('/:id', validate(updateTaskSchema), updateTask)
router.delete('/:id', deleteTask)

export default router