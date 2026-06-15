import AuditLog from '../models/AuditLog.js'

const blockedDetailTerms = [
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'csv',
  'content',
  'buffer',
]

const blockedDetailKeys = new Set(['rows', 'records'])

const isBlockedDetailKey = (key) => {
  const normalizedKey = key.toLowerCase().replaceAll(/[^a-z0-9]/g, '')

  return (
    blockedDetailKeys.has(normalizedKey) ||
    blockedDetailTerms.some((term) => normalizedKey.includes(term))
  )
}

export const sanitizeAuditDetails = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeAuditDetails)
  }

  if (value instanceof Date) {
    return value
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !isBlockedDetailKey(key))
        .map(([key, nestedValue]) => [
          key,
          sanitizeAuditDetails(nestedValue),
        ]),
    )
  }

  return value
}

export const writeAuditLog = async ({
  userId = null,
  action,
  entityType,
  entityId = null,
  details = {},
  status = 'success',
  ipAddress = null,
}) =>
  AuditLog.create({
    userId,
    action,
    entityType,
    entityId: entityId ? String(entityId) : null,
    details: sanitizeAuditDetails(details),
    status,
    ipAddress,
  })
