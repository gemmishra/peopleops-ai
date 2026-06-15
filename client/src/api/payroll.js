import { apiClient } from './client.js'

export const uploadPayrollFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post('/payroll/upload', formData, {
    timeout: 60000,
  })

  return response.data
}

export const getPayrollBatches = async ({
  page = 1,
  limit = 10,
  status,
} = {}) => {
  const response = await apiClient.get('/payroll/batches', {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
  })

  return response.data.data
}

export const getPayrollBatch = async (batchId) => {
  const response = await apiClient.get(`/payroll/batches/${batchId}`)

  return response.data.data.batch
}

export const getBatchEmployees = async (
  batchId,
  {
    page = 1,
    limit = 20,
    riskLevel,
    search,
    sort = 'riskScore',
    order = 'desc',
  } = {},
) => {
  const response = await apiClient.get(
    `/payroll/batches/${batchId}/employees`,
    {
      params: {
        page,
        limit,
        sort,
        order,
        ...(riskLevel ? { riskLevel } : {}),
        ...(search ? { search } : {}),
      },
    },
  )

  return response.data.data
}
