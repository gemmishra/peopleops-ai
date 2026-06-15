const blockedTerms = [
  'password',
  'token',
  'jwt',
  'secret',
  'authorization',
  'csv',
  'content',
  'buffer',
]

const blockedKeys = new Set(['rows', 'records'])

const isBlockedKey = (key) => {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')

  return (
    blockedKeys.has(normalized) ||
    blockedTerms.some((term) => normalized.includes(term))
  )
}

export const sanitizeAuditDetails = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeAuditDetails)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !isBlockedKey(key))
        .map(([key, nestedValue]) => [
          key,
          sanitizeAuditDetails(nestedValue),
        ]),
    )
  }

  return value
}

export const formatAuditValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
