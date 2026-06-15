import { listAuditLogs } from '../services/auditRead.service.js'

export const getAuditLogs = async (req, res) => {
  const data = await listAuditLogs(req.query)

  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data,
  })
}
