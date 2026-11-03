import app from './app'
import { env } from './config/env'

const startServer = () => {
  app.listen(env.port, () => {
    console.log(`Backend server running on http://localhost:${env.port}`)
  })
}

startServer()
