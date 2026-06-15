import { z } from 'zod'
import AuditLog from '../models/AuditLog.js'
import { sanitizeAuditDetails } from './audit.service.js'
import {
  dateRangeSchema,
  getInclusiveDateRange,
  paginationSchema,
  toPagination,
} from '../utils/queryValidation.js'

const auditListQuerySchema = z
  .object({
    ...paginationSchema,
    ...dateRangeSchema,
    action: z.string().trim().min(1).max(100).optional(),
    status: z.enum(['success', 'failure']).optional(),
  })
  .strict()

export const listAuditLogs = async (rawQuery) => {
  const query = auditListQuerySchema.parse(rawQuery)
  const filter = {}
  const createdAt = getInclusiveDateRange(query)

  if (query.action) {
    filter.action = query.action
  }

  if (query.status) {
    filter.status = query.status
  }

  if (createdAt) {
    filter.createdAt = createdAt
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .select(
        'userId action entityType entityId details status ipAddress createdAt',
      )
      .populate({
        path: 'userId',
        select: 'name email role',
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ])

  return {
    auditLogs: logs.map((log) => ({
      id: String(log._id),
      user: log.userId
        ? {
            id: String(log.userId._id),
            name: log.userId.name,
            email: log.userId.email,
            role: log.userId.role,
          }
        : null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: sanitizeAuditDetails(log.details || {}),
      status: log.status,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    pagination: toPagination({
      page: query.page,
      limit: query.limit,
      total,
    }),
  }
}
