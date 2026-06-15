import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import { notFound } from './middleware/notFound.middleware.js'
import aiRoutes from './routes/ai.routes.js'
import authRoutes from './routes/auth.routes.js'
import auditRoutes from './routes/audit.routes.js'
import healthRoutes from './routes/health.routes.js'
import payrollRoutes from './routes/payroll.routes.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json({ limit: '100kb' }))

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/audit-logs', auditRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
