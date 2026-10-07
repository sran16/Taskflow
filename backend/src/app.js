import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { sendError } from './utils/errors.js'

const app = express()

app.use(cors({ origin: env.corsOrigin }))
app.use(express.json())
if (env.nodeEnv !== 'test') app.use(morgan('dev'))

app.use('/api', routes)

// Unknown route
app.use((req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Route introuvable')
})

// Error handling
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_INPUT', 'Corps JSON invalide')
  }
  console.error(err)
  sendError(res, 500, 'INTERNAL_ERROR', 'Erreur serveur')
})

export default app
