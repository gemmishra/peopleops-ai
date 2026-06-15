import { apiClient } from './client.js'

export const getAuditLogs = async ({
  page = 1,
  limit = 20,
  action,
  status,
  from,
  to,
} = {}) => {
  const response = await apiClient.get('/audit-logs', {
    params: {
      page,
      limit,
      ...(action ? { action } : {}),
      ...(status ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    },
  })

  return response.data.data
}
