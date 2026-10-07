import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/app.js'
import { User } from '../src/models/User.js'
import { Task } from '../src/models/Task.js'
import { Habit } from '../src/models/Habit.js'
import { HabitEvent } from '../src/models/HabitEvent.js'

const TEST_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/taskflow_test'

async function register(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'MotDePasse123!' })
  return { status: res.status, token: res.body.token, user: res.body.user }
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

describe('TaskFlow API', () => {
  beforeAll(async () => {
    await mongoose.connect(TEST_URI)
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      Habit.deleteMany({}),
      HabitEvent.deleteMany({}),
    ])
  })

  describe('health', () => {
    test('GET /api/health -> {"status":"ok"}', async () => {
      const res = await request(app).get('/api/health')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ status: 'ok' })
    })
  })

  describe('auth', () => {
    test('register -> 201, token + id, no password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'alice@test.fr', password: 'MotDePasse123!' })

      expect(res.status).toBe(201)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.id).toBeTruthy()
      expect(res.body.user.password).toBeUndefined()
    })

    test('register duplicate -> 409 EMAIL_ALREADY_USED', async () => {
      await register('dup@test.fr')
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@test.fr', password: 'MotDePasse123!' })

      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('EMAIL_ALREADY_USED')
    })

    test('register invalid body -> 400 INVALID_INPUT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad', password: '1' })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('login -> 200 + token', async () => {
      await register('login@test.fr')
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.fr', password: 'MotDePasse123!' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeTruthy()
    })

    test('login wrong password -> 401 UNAUTHORIZED', async () => {
      await register('wrong@test.fr')
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.fr', password: 'nope' })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    test('GET /api/auth/me without token -> 401', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })
  })

  describe('habits', () => {
    let token

    beforeEach(async () => {
      ;({ token } = await register('habits@test.fr'))
    })

    test('CRUD + dated realizations', async () => {
      const created = await request(app)
        .post('/api/habits')
        .set(auth(token))
        .send({ title: 'Marcher', frequency: 'daily', active: true })
      expect(created.status).toBe(201)
      const id = created.body.id

      const missingActive = await request(app)
        .post('/api/habits')
        .set(auth(token))
        .send({ title: 'Lire', frequency: 'daily' })
      expect(missingActive.status).toBe(400)

      const event = await request(app)
        .post(`/api/habits/${id}/events`)
        .set(auth(token))
        .send({ date: '2026-10-05' })
      expect(event.status).toBe(201)

      // same day twice is idempotent
      const again = await request(app)
        .post(`/api/habits/${id}/events`)
        .set(auth(token))
        .send({ date: '2026-10-05' })
      expect(again.status).toBe(200)

      const badDate = await request(app)
        .post(`/api/habits/${id}/events`)
        .set(auth(token))
        .send({ date: '2026-02-30' })
      expect(badDate.status).toBe(400)

      const list = await request(app).get(`/api/habits/${id}/events`).set(auth(token))
      expect(list.body.items).toHaveLength(1)

      const removed = await request(app)
        .delete(`/api/habits/${id}/events/2026-10-05`)
        .set(auth(token))
      expect(removed.status).toBe(204)

      const empty = await request(app).get(`/api/habits/${id}/events`).set(auth(token))
      expect(empty.body.items).toHaveLength(0)
    })
  })

  describe('stats & heatmap', () => {
    let token

    beforeEach(async () => {
      ;({ token } = await register('stats@test.fr'))
    })

    test('GET /api/stats/weekly -> items with rates', async () => {
      const res = await request(app).get('/api/stats/weekly?weeks=2').set(auth(token))
      expect(res.status).toBe(200)
      expect(res.body.items).toHaveLength(2)
      expect(typeof res.body.items[0].tasks.rate).toBe('number')
    })

    test('stats without token -> 401', async () => {
      const res = await request(app).get('/api/stats/weekly')
      expect(res.status).toBe(401)
    })

    test('stats weeks=99 -> 400 INVALID_INPUT', async () => {
      const res = await request(app).get('/api/stats/weekly?weeks=99').set(auth(token))
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_INPUT')
    })

    test('GET /api/heatmap -> weeks/days', async () => {
      const res = await request(app)
        .get('/api/heatmap?from=2026-10-01&to=2026-10-07&timezone=Europe/Paris')
        .set(auth(token))
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.weeks)).toBe(true)
    })
  })
})
