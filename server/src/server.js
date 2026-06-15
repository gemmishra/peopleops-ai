import app from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'
import { seedAdmin } from './services/seedAdmin.service.js'

let server
let isShuttingDown = false

const startServer = async () => {
  await connectDB()
  await seedAdmin()

  server = app.listen(env.PORT, () => {
    console.info(
      `PeopleOps AI API listening on port ${env.PORT} (${env.NODE_ENV})`,
    )
  })
}

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.info(`${signal} received. Shutting down gracefully.`)

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  await disconnectDB()
  process.exit(0)
}

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('Graceful shutdown failed', error)
    process.exit(1)
  })
})

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('Graceful shutdown failed', error)
    process.exit(1)
  })
})

startServer().catch((error) => {
  console.error('Server startup failed', error)
  process.exit(1)
})
