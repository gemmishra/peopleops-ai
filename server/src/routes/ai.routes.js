import { Router } from 'express'
import { createPayrollReview } from '../controllers/ai.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post(
  '/payroll-review/:batchId',
  protect,
  asyncHandler(createPayrollReview),
)

export default router
