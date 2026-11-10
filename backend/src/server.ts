import { createApp } from './app'
import { env } from './config/env'

const startServer = async () => {
  const app = await createApp()
  app.listen(env.port, () => {
    console.log(`Backend server running on http://localhost:${env.port}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start the server:', err)
  process.exit(1)
})
