import app from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

async function start() {
  await connectDB()
  app.listen(env.port, () => {
    console.log(`API démarrée sur http://localhost:${env.port}`)
  })
}

start().catch((error) => {
  console.error('Impossible de démarrer le serveur :', error.message)
  process.exit(1)
})
