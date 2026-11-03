import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import healthRoute from './routes/healthRoute'

const app = express()

app.use(cors({
  origin: env.frontendOrigin,
  credentials: true,
}))
app.use(express.json())
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

app.use(notFoundHandler)
app.use(errorHandler)

export default app
