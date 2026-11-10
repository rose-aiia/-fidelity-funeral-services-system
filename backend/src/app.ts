import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import healthRoute from './routes/healthRoute'
import { createAlertsRuntime } from './alerts'

/** Async because the alerts runtime connects to the job queue before its routes can be mounted. */
export async function createApp() {
  const app = express()

  app.use(cors({
    origin: env.frontendOrigin,
    credentials: true,
  }))
  app.use(express.json())
  app.use(express.urlencoded({ extended: false })) // Twilio and Africa's Talking post forms
  app.use(requestLogger)

  app.get('/', (_req, res) => {
    res.json({
      name: 'Fidelity Life Assurance Platform API',
      status: 'running',
      environment: env.nodeEnv,
      version: '0.1.0',
    })
  })

  app.use('/api', healthRoute)

  const alerts = await createAlertsRuntime()
  if (alerts) {
    app.use('/api/alerts', alerts.router)
    app.use('/api/admin', alerts.adminRouter)
  }

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
