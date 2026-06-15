import { writeAuditLog } from '../services/audit.service.js'
import { generatePayrollReview } from '../services/aiPayrollReview.service.js'

export const buildAiReviewAuditDetails = (result) => ({
  provider: result.provider,
  model: result.model,
  selectedEmployeeCount: result.selectedEmployeeCount,
  riskCounts: result.riskCounts,
})

export const createPayrollReview = async (req, res) => {
  const result = await generatePayrollReview(req.params.batchId)

  await writeAuditLog({
    userId: req.user.id,
    action: 'AI_PAYROLL_REVIEW_GENERATED',
    entityType: 'PayrollBatch',
    entityId: result.batchId,
    details: buildAiReviewAuditDetails(result),
    status: 'success',
    ipAddress: req.ip,
  })

  res.status(200).json({
    success: true,
    message: 'AI payroll review generated successfully',
    data: {
      review: result.review,
      provider: result.provider,
      model: result.model,
      batchId: result.batchId,
      selectedEmployeeCount: result.selectedEmployeeCount,
      generatedAt: new Date().toISOString(),
    },
  })
}
