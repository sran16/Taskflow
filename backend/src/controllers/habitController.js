import mongoose from 'mongoose'
import { Habit } from '../models/Habit.js'
import { HabitEvent } from '../models/HabitEvent.js'
import { civilDateSchema } from '../validators/habitValidators.js'
import { sendError } from '../utils/errors.js'

function validId(id) {
  return mongoose.isObjectIdOrHexString(id)
}

// Public shape: `id`, never `_id`. Owner is never exposed.
function publicHabit(habit) {
  return {
    id: habit._id,
    title: habit.title,
    frequency: habit.frequency,
    active: habit.active,
  }
}

function publicEvent(event) {
  return {
    id: event._id,
    habitId: event.habitId,
    date: event.date,
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
    // ownerId always comes from the verified JWT, never from the client.
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

    // Remove the habit's realizations too.
    await HabitEvent.deleteMany({ habitId: habit._id, ownerId: req.user._id })
    return res.status(204).end()
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la suppression de l’habitude')
  }
}

// GET /api/habits/:id/events
export async function listHabitEvents(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')

  try {
    const habit = await Habit.findOne({ _id: req.params.id, ownerId: req.user._id })
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')

    const events = await HabitEvent.find({ habitId: habit._id, ownerId: req.user._id }).sort({ date: -1 })
    return res.json({ items: events.map(publicEvent) })
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la récupération des réalisations')
  }
}

// POST /api/habits/:id/events  (log a dated realization)
export async function createHabitEvent(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')

  try {
    const habit = await Habit.findOne({ _id: req.params.id, ownerId: req.user._id })
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')

    // Idempotent: logging the same day twice returns the existing realization.
    const existing = await HabitEvent.findOne({ habitId: habit._id, date: req.body.date })
    if (existing) return res.status(200).json(publicEvent(existing))

    const event = await HabitEvent.create({
      habitId: habit._id,
      ownerId: req.user._id,
      date: req.body.date,
    })
    return res.status(201).json(publicEvent(event))
  } catch (error) {
    if (error.code === 11000) {
      const existing = await HabitEvent.findOne({ habitId: req.params.id, date: req.body.date })
      return res.status(200).json(publicEvent(existing))
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de l’enregistrement de la réalisation')
  }
}

// DELETE /api/habits/:id/events/:date
export async function deleteHabitEvent(req, res) {
  if (!validId(req.params.id)) return sendError(res, 400, 'INVALID_INPUT', 'Identifiant invalide')
  if (!civilDateSchema.safeParse(req.params.date).success) {
    return sendError(res, 400, 'INVALID_INPUT', 'Date invalide')
  }

  try {
    const habit = await Habit.findOne({ _id: req.params.id, ownerId: req.user._id })
    if (!habit) return sendError(res, 404, 'NOT_FOUND', 'Habitude introuvable')

    const event = await HabitEvent.findOneAndDelete({
      habitId: habit._id,
      ownerId: req.user._id,
      date: req.params.date,
    })
    if (!event) return sendError(res, 404, 'NOT_FOUND', 'Réalisation introuvable')
    return res.status(204).end()
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Erreur lors de la suppression de la réalisation')
  }
}
