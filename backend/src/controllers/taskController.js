import mongoose from 'mongoose'
import { Task } from '../models/Task.js'
import { sendError } from '../utils/errors.js'

//bonus1 : filtrage
function buildTaskFilter(userId, filters) {
  const query = { user: userId }
  if (filters.status) query.status = filters.status

  if (filters.dueDate !== undefined) {query.dueDate = filters.dueDate === 'null' ? null : filters.dueDate} 
  else if (filters.dueDateFrom || filters.dueDateTo) {
    query.dueDate = {}
    if (filters.dueDateFrom) query.dueDate.$gte = filters.dueDateFrom
    if (filters.dueDateTo) query.dueDate.$lte = filters.dueDateTo
  } return query
}

///// mongoose
function validTaskId(id) {return mongoose.isObjectIdOrHexString(id)}

//// handling erreur
function handleTaskError(res, error, message) {
  console.error('Erreur Task:', error)
  return sendError(res, 500, 'INTERNAL_ERROR', message)
}

// GET toutes les tasks
export async function listTasks(req, res) {
  try {
    const filter = buildTaskFilter(req.user._id, req.validatedQuery) // bonus1 : filtrage ---
    const tasks = await Task.find(filter).sort({ createdAt: -1, _id: -1 }) 
    return res.json({ tasks })
  } catch (error) {return handleTaskError(res, error, 'Erreur lors de la récupération des tâches')}
}

// GET compte de toutes les taches de l'user
export async function countTasks(req, res) {
  try {
    const filter = buildTaskFilter(req.user._id, req.validatedQuery)
    const groupedCounts = await Task.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    const byStatus = { todo: 0, doing: 0, done: 0 }
    for (const group of groupedCounts) byStatus[group._id] = group.count

    return res.json({count: Object.values(byStatus).reduce((total, value) => total + value, 0), byStatus})
  } catch (error) {return handleTaskError(res, error, 'Erreur lors du comptage des tâches')}
}

// create tasks 
export async function createTask(req, res) {
  try {
    const task = await Task.create({
      ...req.body,
      completedAt: req.body.status === 'done' ? new Date() : null,
      user: req.user._id,
    })
    return res.status(201).json({ task })
  } catch (error) {return handleTaskError(res, error, 'Erreur lors de la création de la tâche')}
}

// chopper les tasks par id
export async function getTask(req, res) {
  if (!validTaskId(req.params.id)) return sendError(res, 400, 'INVALID_ID', 'Identifiant de tâche invalide')

  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
    if (!task) return sendError(res, 404, 'TASK_NOT_FOUND', 'Tâche introuvable')
    return res.json({ task })
  } catch (error) {return handleTaskError(res, error, 'Erreur lors de la récupération de la tâche')}
}

// update (ça peut être un patch ou put mais ici on va faire patch , ligne 13 : taskRoutes.js)
export async function updateTask(req, res) {
  if (!validTaskId(req.params.id)) {return sendError(res, 400, 'INVALID_ID', 'Identifiant de tâche invalide')}

  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
    if (!task) return sendError(res, 404, 'TASK_NOT_FOUND', 'Tâche introuvable')

    const wasDone = task.status === 'done'
    Object.assign(task, req.body)

    if (!wasDone && task.status === 'done') task.completedAt = new Date()
    else if (wasDone && task.status !== 'done') task.completedAt = null

    await task.save()
    return res.json({ task })
  } catch (error) {return handleTaskError(res, error, 'Erreur lors de la modification de la tâche')}
}

// DELETE :T
export async function deleteTask(req, res) {
  if (!validTaskId(req.params.id)) return sendError(res, 400, 'INVALID_ID', 'Identifiant de tâche invalide')

  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!task) {return sendError(res, 404, 'TASK_NOT_FOUND', 'Tâche introuvable')}
    return res.status(204).end()
  } catch (error) {return handleTaskError(res, error, 'Erreur lors de la suppression de la tâche')}
}