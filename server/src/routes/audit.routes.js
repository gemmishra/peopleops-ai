import { Router } from 'express'
import { getAuditLogs } from '../controllers/audit.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.get('/', protect, asyncHandler(getAuditLogs))

export default router
