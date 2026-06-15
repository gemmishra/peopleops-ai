import { apiClient } from './client.js'

export const generatePayrollAiReview = async (batchId) => {
  const response = await apiClient.post(`/ai/payroll-review/${batchId}`)

  return response.data.data
}
