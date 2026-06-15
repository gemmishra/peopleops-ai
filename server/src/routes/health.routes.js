import { Router } from 'express'
import { env } from '../config/env.js'

const router = Router()

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  })
})

export default router
