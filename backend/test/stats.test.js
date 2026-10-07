import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

import { startOfIsoWeek, addDays, civilDate, getWeeklyStats } from '../src/services/statsService.js'
import { Task } from '../src/models/Task.js'
import { Habit } from '../src/models/Habit.js'
import { HabitEvent } from '../src/models/HabitEvent.js'

// ---------- pure date helpers ----------

test('startOfIsoWeek returns the Monday of the week (UTC)', () => {
  assert.equal(civilDate(startOfIsoWeek(new Date('2026-10-08T12:00:00Z'))), '2026-10-05')
  // Sunday still belongs to the week that started on Monday
  assert.equal(civilDate(startOfIsoWeek(new Date('2026-10-11T23:59:00Z'))), '2026-10-05')
  assert.equal(civilDate(startOfIsoWeek(new Date('2026-10-12T00:00:00Z'))), '2026-10-12')
})

test('addDays and civilDate', () => {
  assert.equal(civilDate(addDays(new Date('2026-10-05T00:00:00Z'), 7)), '2026-10-12')
  assert.equal(civilDate(addDays(new Date('2026-10-05T00:00:00Z'), -1)), '2026-10-04')
})

// ---------- aggregation tests (need a running MongoDB) ----------

test('weekly stats aggregations (tasks + habits)', async (t) => {
  const uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/taskflow_test'
  await mongoose.connect(uri)
  t.after(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  })

  await Promise.all([Task.deleteMany({}), Habit.deleteMany({}), HabitEvent.deleteMany({})])

  const ownerId = new mongoose.Types.ObjectId()

  // Tasks (raw insert to control createdAt/completedAt)
  await Task.collection.insertMany([
    // created and completed this week
    { user: ownerId, title: 'A', status: 'done', description: '', dueDate: null, priority: 'medium', completedAt: new Date('2026-10-07T10:00:00Z'), createdAt: new Date('2026-10-06T10:00:00Z'), updatedAt: new Date('2026-10-07T10:00:00Z'), __v: 0 },
    // created this week, still open
    { user: ownerId, title: 'B', status: 'todo', description: '', dueDate: null, priority: 'medium', completedAt: null, createdAt: new Date('2026-10-06T10:00:00Z'), updatedAt: new Date('2026-10-06T10:00:00Z'), __v: 0 },
    // created before, completed this week
    { user: ownerId, title: 'C', status: 'done', description: '', dueDate: null, priority: 'medium', completedAt: new Date('2026-10-06T10:00:00Z'), createdAt: new Date('2026-09-01T10:00:00Z'), updatedAt: new Date('2026-10-06T10:00:00Z'), __v: 0 },
    // already completed before this week -> not open, not completed now
    { user: ownerId, title: 'D', status: 'done', description: '', dueDate: null, priority: 'medium', completedAt: new Date('2026-09-15T10:00:00Z'), createdAt: new Date('2026-09-01T10:00:00Z'), updatedAt: new Date('2026-09-15T10:00:00Z'), __v: 0 },
  ])

  // Habits
  const habitDaily = new mongoose.Types.ObjectId()
  const habitWeekly = new mongoose.Types.ObjectId()
  const habitInactive = new mongoose.Types.ObjectId()
  const now = new Date()
  await Habit.collection.insertMany([
    { _id: habitDaily, ownerId, title: 'Daily', frequency: 'daily', active: true, createdAt: now, updatedAt: now, __v: 0 },
    { _id: habitWeekly, ownerId, title: 'Weekly', frequency: 'weekly', active: true, createdAt: now, updatedAt: now, __v: 0 },
    { _id: habitInactive, ownerId, title: 'Inactive', frequency: 'daily', active: false, createdAt: now, updatedAt: now, __v: 0 },
  ])

  await HabitEvent.collection.insertMany([
    { ownerId, habitId: habitDaily, date: '2026-10-05', createdAt: now, updatedAt: now, __v: 0 },
    { ownerId, habitId: habitDaily, date: '2026-10-06', createdAt: now, updatedAt: now, __v: 0 },
    { ownerId, habitId: habitDaily, date: '2026-10-07', createdAt: now, updatedAt: now, __v: 0 },
    { ownerId, habitId: habitWeekly, date: '2026-10-06', createdAt: now, updatedAt: now, __v: 0 },
    // inactive habit realization must be ignored
    { ownerId, habitId: habitInactive, date: '2026-10-05', createdAt: now, updatedAt: now, __v: 0 },
  ])

  // Thursday 2026-10-08 -> current ISO week is 2026-10-05 .. 2026-10-11
  const items = await getWeeklyStats(ownerId, 2, new Date('2026-10-08T12:00:00Z'))
  assert.equal(items.length, 2)

  const [previousWeek, currentWeek] = items

  // Previous week: 2026-09-28 .. 2026-10-04
  assert.equal(previousWeek.weekStart, '2026-09-28')
  assert.equal(previousWeek.weekEnd, '2026-10-04')
  assert.deepEqual(previousWeek.tasks, { completed: 0, open: 1, rate: 0 })
  assert.deepEqual(previousWeek.habits, { done: 0, expected: 8, rate: 0 })
  assert.deepEqual(previousWeek.evolution, { tasks: null, habits: null })

  // Current week: 2026-10-05 .. 2026-10-11
  assert.equal(currentWeek.weekStart, '2026-10-05')
  assert.equal(currentWeek.weekEnd, '2026-10-11')
  assert.deepEqual(currentWeek.tasks, { completed: 2, open: 3, rate: 0.667 })
  assert.deepEqual(currentWeek.habits, { done: 4, expected: 8, rate: 0.5 })
  assert.deepEqual(currentWeek.evolution, { tasks: 0.667, habits: 0.5 })
})
