import mongoose from 'mongoose'
import { Task } from '../models/Task.js'
import { sendError } from '../utils/errors.js'

///// mongoose
function validTaskId(id) {
  return mongoose.isObjectIdOrHexString(id)
}

//// handling erreur
function handleTaskError(res, error, message) {
  console.error('Erreur Task:', error)
  return sendError(res, 500, 'INTERNAL_ERROR', message)
}

// GET toutes les tasks
export async function listTasks(req, res) {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 })
    return res.json({ tasks })
  } catch (error) {return handleTaskError(res, error, 'Erreur lors de la récupération des tâches')}
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