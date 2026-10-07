import request from 'supertest'
import mongoose from 'mongoose'
import app from '../src/app.js'
import { User } from '../src/models/User.js'
import { Task } from '../src/models/Task.js'
import { Habit } from '../src/models/Habit.js'

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
    await Promise.all([User.deleteMany({}), Task.deleteMany({}), Habit.deleteMany({})])
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

    test('CRUD + dated realizations stored in the habit', async () => {
      const created = await request(app)
        .post('/api/habits')
        .set(auth(token))
        .send({ title: 'Marcher', frequency: 'daily', active: true })
      expect(created.status).toBe(201)
      expect(created.body.dates).toEqual([])
      const id = created.body.id

      const missingActive = await request(app)
        .post('/api/habits')
        .set(auth(token))
        .send({ title: 'Lire', frequency: 'daily' })
      expect(missingActive.status).toBe(400)

      // mark a realization for a date
      const marked = await request(app)
        .post(`/api/habits/${id}/events`)
        .set(auth(token))
        .send({ date: '2026-10-05' })
      expect(marked.status).toBe(200)
      expect(marked.body.dates).toContain('2026-10-05')

      // same day twice stays a single entry
      const again = await request(app)
        .post(`/api/habits/${id}/events`)
        .set(auth(token))
        .send({ date: '2026-10-05' })
      expect(again.body.dates).toEqual(['2026-10-05'])

      const badDate = await request(app)
        .post(`/api/habits/${id}/events`)
        .set(auth(token))
        .send({ date: '2026-02-30' })
      expect(badDate.status).toBe(400)

      // unmark
      const unmarked = await request(app)
        .delete(`/api/habits/${id}/events/2026-10-05`)
        .set(auth(token))
      expect(unmarked.status).toBe(200)
      expect(unmarked.body.dates).toEqual([])
    })
  })
})
