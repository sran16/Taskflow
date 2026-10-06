// End-to-end smoke test: boots the API on an ephemeral port against a
// dedicated database and walks through every feature (auth, tasks, habits, stats).
//
//   node scripts/smoke-test.mjs
//
// Requires a running MongoDB. Uses taskflow_smoke (dropped at the end).

process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/taskflow_smoke'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret'

const { default: app } = await import('../src/app.js')
const { connectDB } = await import('../src/config/db.js')
const mongoose = (await import('mongoose')).default

await connectDB()
await mongoose.connection.dropDatabase()

const server = app.listen(0)
const port = server.address().port
const base = `http://127.0.0.1:${port}/api`

let pass = 0
let fail = 0

function check(name, ok, extra = '') {
  if (ok) {
    pass += 1
    console.log(`  ok   ${name}`)
  } else {
    fail += 1
    console.log(`  FAIL ${name} ${extra}`)
  }
}

async function req(method, path, { token, body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(base + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  return { status: res.status, data }
}

console.log('\nAuth')
const health = await req('GET', '/health')
check('GET /health -> {"status":"ok"}', health.status === 200 && health.data.status === 'ok')

const email = `smoke_${Date.now()}@test.fr`
const regA = await req('POST', '/auth/register', { body: { email, password: 'MotDePasse123!' } })
check('register -> 201 + token + id', regA.status === 201 && regA.data.token && regA.data.user.id)
check('register hides password', regA.data.user && !('password' in regA.data.user))
const tokenA = regA.data.token

const regDup = await req('POST', '/auth/register', { body: { email, password: 'MotDePasse123!' } })
check('register duplicate -> 409 EMAIL_ALREADY_USED', regDup.status === 409 && regDup.data.error.code === 'EMAIL_ALREADY_USED')

const regBad = await req('POST', '/auth/register', { body: { email: 'bad', password: '1' } })
check('register invalid -> 400 INVALID_INPUT', regBad.status === 400 && regBad.data.error.code === 'INVALID_INPUT')

const login = await req('POST', '/auth/login', { body: { email, password: 'MotDePasse123!' } })
check('login -> 200 + token', login.status === 200 && login.data.token)

const loginBad = await req('POST', '/auth/login', { body: { email, password: 'wrong' } })
check('login wrong -> 401 UNAUTHORIZED', loginBad.status === 401 && loginBad.data.error.code === 'UNAUTHORIZED')

const meNoToken = await req('GET', '/auth/me')
check('GET /auth/me without token -> 401', meNoToken.status === 401)

const me = await req('GET', '/auth/me', { token: tokenA })
check('GET /auth/me with token -> 200', me.status === 200 && me.data.user.email === email)

console.log('\nTasks')
const createTask = await req('POST', '/tasks', { token: tokenA, body: { title: 'Demo', status: 'todo', priority: 'high', dueDate: '2026-10-10' } })
check('POST /tasks -> 201 with id (no _id)', createTask.status === 201 && createTask.data.id && createTask.data._id === undefined)
const taskId = createTask.data.id

const listTasks = await req('GET', '/tasks', { token: tokenA })
check('GET /tasks -> { items: [...] }', listTasks.status === 200 && Array.isArray(listTasks.data.items))

const getTask = await req('GET', `/tasks/${taskId}`, { token: tokenA })
check('GET /tasks/:id -> object', getTask.status === 200 && getTask.data.id === taskId)

const patchTask = await req('PATCH', `/tasks/${taskId}`, { token: tokenA, body: { status: 'done' } })
check('PATCH status=done fills completedAt', patchTask.status === 200 && patchTask.data.completedAt)

const filterTasks = await req('GET', '/tasks?status=done', { token: tokenA })
check('GET /tasks?status=done filters', filterTasks.status === 200 && filterTasks.data.items.length === 1)

const countTasks = await req('GET', '/tasks/count', { token: tokenA })
check('GET /tasks/count -> count + byStatus', countTasks.status === 200 && typeof countTasks.data.count === 'number')

const badTaskId = await req('GET', '/tasks/abc', { token: tokenA })
check('GET /tasks/abc -> 400 INVALID_INPUT', badTaskId.status === 400 && badTaskId.data.error.code === 'INVALID_INPUT')

const regB = await req('POST', '/auth/register', { body: { email: `smoke_b_${Date.now()}@test.fr`, password: 'MotDePasse123!' } })
const tokenB = regB.data.token
const otherUserTask = await req('GET', `/tasks/${taskId}`, { token: tokenB })
check('other user task -> 404 NOT_FOUND', otherUserTask.status === 404 && otherUserTask.data.error.code === 'NOT_FOUND')

console.log('\nHabits (B2)')
const createHabit = await req('POST', '/habits', { token: tokenA, body: { title: 'Marcher', frequency: 'daily', active: true } })
check('POST /habits -> 201 with id', createHabit.status === 201 && createHabit.data.id)
const habitId = createHabit.data.id

const habitNoActive = await req('POST', '/habits', { token: tokenA, body: { title: 'Lire', frequency: 'daily' } })
check('habit without active -> 400', habitNoActive.status === 400 && habitNoActive.data.error.code === 'INVALID_INPUT')

const createEvent = await req('POST', `/habits/${habitId}/events`, { token: tokenA, body: { date: '2026-10-05' } })
check('POST habit event -> 201', createEvent.status === 201 && createEvent.data.date === '2026-10-05')

const eventAgain = await req('POST', `/habits/${habitId}/events`, { token: tokenA, body: { date: '2026-10-05' } })
check('same event again -> 200 (idempotent)', eventAgain.status === 200)

const badDate = await req('POST', `/habits/${habitId}/events`, { token: tokenA, body: { date: '2026-02-30' } })
check('impossible date -> 400', badDate.status === 400 && badDate.data.error.code === 'INVALID_INPUT')

const listEvents = await req('GET', `/habits/${habitId}/events`, { token: tokenA })
check('GET habit events -> { items: [...] }', listEvents.status === 200 && Array.isArray(listEvents.data.items))

console.log('\nStats (B4)')
const stats = await req('GET', '/stats/weekly?weeks=2', { token: tokenA })
check('GET /stats/weekly -> items', stats.status === 200 && Array.isArray(stats.data.items) && stats.data.items.length === 2)
check('stats items expose rates', stats.data.items[1] && typeof stats.data.items[1].tasks.rate === 'number')

const statsNoToken = await req('GET', '/stats/weekly')
check('stats without token -> 401', statsNoToken.status === 401)

const statsBadWeeks = await req('GET', '/stats/weekly?weeks=99', { token: tokenA })
check('stats weeks=99 -> 400 INVALID_INPUT', statsBadWeeks.status === 400)

console.log('\nCleanup')
const delTask = await req('DELETE', `/tasks/${taskId}`, { token: tokenA })
check('DELETE task -> 204', delTask.status === 204)
const getDeleted = await req('GET', `/tasks/${taskId}`, { token: tokenA })
check('GET deleted task -> 404', getDeleted.status === 404)

const delHabit = await req('DELETE', `/habits/${habitId}`, { token: tokenA })
check('DELETE habit -> 204', delHabit.status === 204)

server.close()
await mongoose.connection.dropDatabase()
await mongoose.disconnect()

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
