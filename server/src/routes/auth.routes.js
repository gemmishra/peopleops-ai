import { Router } from 'express'
import {
  getCurrentUser,
  login,
} from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post('/login', asyncHandler(login))
router.get('/me', protect, asyncHandler(getCurrentUser))

export default router
