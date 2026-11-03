export type HealthStatus = {
  status: 'ok' | 'error'
  message: string
  timestamp: string
  database: 'connected' | 'disconnected'
}
