import mongoose from 'mongoose'
import { startOfIsoWeek, addDays, civilDate, getWeeklyStats } from '../src/services/statsService.js'
import { Task } from '../src/models/Task.js'
import { Habit } from '../src/models/Habit.js'
import { HabitEvent } from '../src/models/HabitEvent.js'

const TEST_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/taskflow_test'

describe('date helpers', () => {
  test('startOfIsoWeek returns the Monday of the week (UTC)', () => {
    expect(civilDate(startOfIsoWeek(new Date('2026-10-08T12:00:00Z')))).toBe('2026-10-05')
    // Sunday still belongs to the week that started on Monday
    expect(civilDate(startOfIsoWeek(new Date('2026-10-11T23:59:00Z')))).toBe('2026-10-05')
    expect(civilDate(startOfIsoWeek(new Date('2026-10-12T00:00:00Z')))).toBe('2026-10-12')
  })

  test('addDays and civilDate', () => {
    expect(civilDate(addDays(new Date('2026-10-05T00:00:00Z'), 7))).toBe('2026-10-12')
    expect(civilDate(addDays(new Date('2026-10-05T00:00:00Z'), -1))).toBe('2026-10-04')
  })
})

describe('weekly stats aggregations', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_URI)
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Promise.all([Task.deleteMany({}), Habit.deleteMany({}), HabitEvent.deleteMany({})])
  })

  test('computes task and habit rates for the current and previous week', async () => {
    const ownerId = new mongoose.Types.ObjectId()

    await Task.collection.insertMany([
      { user: ownerId, title: 'A', status: 'done', description: '', dueDate: null, priority: 'medium', completedAt: new Date('2026-10-07T10:00:00Z'), createdAt: new Date('2026-10-06T10:00:00Z'), updatedAt: new Date('2026-10-07T10:00:00Z'), __v: 0 },
      { user: ownerId, title: 'B', status: 'todo', description: '', dueDate: null, priority: 'medium', completedAt: null, createdAt: new Date('2026-10-06T10:00:00Z'), updatedAt: new Date('2026-10-06T10:00:00Z'), __v: 0 },
      { user: ownerId, title: 'C', status: 'done', description: '', dueDate: null, priority: 'medium', completedAt: new Date('2026-10-06T10:00:00Z'), createdAt: new Date('2026-09-01T10:00:00Z'), updatedAt: new Date('2026-10-06T10:00:00Z'), __v: 0 },
      { user: ownerId, title: 'D', status: 'done', description: '', dueDate: null, priority: 'medium', completedAt: new Date('2026-09-15T10:00:00Z'), createdAt: new Date('2026-09-01T10:00:00Z'), updatedAt: new Date('2026-09-15T10:00:00Z'), __v: 0 },
    ])

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
      { ownerId, habitId: habitInactive, date: '2026-10-05', createdAt: now, updatedAt: now, __v: 0 },
    ])

    // Thursday 2026-10-08 -> current ISO week is 2026-10-05 .. 2026-10-11
    const items = await getWeeklyStats(ownerId, 2, new Date('2026-10-08T12:00:00Z'))

    expect(items).toHaveLength(2)

    // Previous week: 2026-09-28 .. 2026-10-04
    expect(items[0]).toEqual({
      weekStart: '2026-09-28',
      weekEnd: '2026-10-04',
      tasks: { completed: 0, open: 1, rate: 0 },
      habits: { done: 0, expected: 8, rate: 0 },
      evolution: { tasks: null, habits: null },
    })

    // Current week: 2026-10-05 .. 2026-10-11
    expect(items[1]).toEqual({
      weekStart: '2026-10-05',
      weekEnd: '2026-10-11',
      tasks: { completed: 2, open: 3, rate: 0.667 },
      habits: { done: 4, expected: 8, rate: 0.5 },
      evolution: { tasks: 0.667, habits: 0.5 },
    })
  })
})
