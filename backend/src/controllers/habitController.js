import mongoose from 'mongoose'
import { Habit } from '../models/Habit.js'
import { civilDateSchema } from '../validators/habitValidators.js'
import { sendError } from '../utils/errors.js'

function validId(id) {
  return mongoose.isObjectIdOrHexString(id)
}

// Public shape: `id` (never `_id`) + the realization dates.
function publicHabit(habit) {
  return {
    id: habit._id,
    title: habit.title,
    frequency: habit.frequency,
    active: habit.active,
    dates: habit.dates,
  }
}

// GET /api/habits
export async function listHabits(req, res) {
  try {
    const habits = await Habit.find({ ownerId: req.user._id }).sort({ createdAt: -1, _id: -1 })
    return res.json({ items: habits.map(publicHabit) })
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la récupération des habitudes')
  }
}

// POST /api/habits
export async function createHabit(req, res) {
  try {
    const habit = await Habit.create({ ...req.body, ownerId: req.user._id })
    return res.status(201).json(publicHabit(habit))
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la création de l’habitude')
  }
}

// GET /api/habits/:id
export async function getHabit(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')

  try {
    const habit = await Habit.findOne({ _id: req.params.id, ownerId: req.user._id })
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')
    return res.json(publicHabit(habit))
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la récupération de l’habitude')
  }
}

// PATCH /api/habits/:id
export async function updateHabit(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')

  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')
    return res.json(publicHabit(habit))
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la modification de l’habitude')
  }
}

// DELETE /api/habits/:id
export async function deleteHabit(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')

  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id })
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')
    return res.status(204).end()
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la suppression de l’habitude')
  }
}

// POST /api/habits/:id/events -> mark a realization for a date
export async function addHabitDate(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')

  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { $addToSet: { dates: req.body.date } },
      { new: true }
    )
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')
    return res.json(publicHabit(habit))
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de l’enregistrement de la réalisation')
  }
}

// DELETE /api/habits/:id/events/:date -> unmark a realization
export async function removeHabitDate(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')
  if (!civilDateSchema.safeParse(req.params.date).success) {
    return sendError(res, 400, 'INVALID_INPUT', 'Date invalide')
  }

  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { $pull: { dates: req.params.date } },
      { new: true }
    )
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')
    return res.json(publicHabit(habit))
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la suppression de la réalisation')
  }
}
