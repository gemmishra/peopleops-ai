import { Router } from 'express'
import {
  getEmployeeRisk,
  getLatestHighRiskPayroll,
  getLatestPayrollSummary,
  getPayrollBatchById,
  getPayrollBatchEmployees,
  getPayrollBatches,
  getPayrollBatchSummary,
  uploadPayroll,
} from '../controllers/payroll.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { uploadPayrollCsv } from '../middleware/upload.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.post(
  '/upload',
  protect,
  uploadPayrollCsv.single('file'),
  asyncHandler(uploadPayroll),
)

router.get(
  '/batches/latest/summary',
  protect,
  asyncHandler(getLatestPayrollSummary),
)
router.get(
  '/batches/latest/high-risk',
  protect,
  asyncHandler(getLatestHighRiskPayroll),
)
router.get(
  '/employee/:employeeId/risk',
  protect,
  asyncHandler(getEmployeeRisk),
)
router.get('/batches', protect, asyncHandler(getPayrollBatches))
router.get(
  '/batches/:batchId/employees',
  protect,
  asyncHandler(getPayrollBatchEmployees),
)
router.get(
  '/batches/:batchId/summary',
  protect,
  asyncHandler(getPayrollBatchSummary),
)
router.get(
  '/batches/:batchId',
  protect,
  asyncHandler(getPayrollBatchById),
)

export default router
