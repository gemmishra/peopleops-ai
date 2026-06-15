import { apiClient } from './client.js'

const isNoDataResponse = (result) =>
  result.status === 'rejected' && result.reason.response?.status === 404

export const getDashboardOverview = async () => {
  const [batchesResult, summaryResult, highRiskResult] =
    await Promise.allSettled([
      apiClient.get('/payroll/batches', {
        params: {
          page: 1,
          limit: 5,
        },
      }),
      apiClient.get('/payroll/batches/latest/summary'),
      apiClient.get('/payroll/batches/latest/high-risk'),
    ])

  if (batchesResult.status === 'rejected') {
    throw batchesResult.reason
  }

  const batchesData = batchesResult.value.data.data

  if (batchesData.pagination.total === 0) {
    return {
      totalBatches: 0,
      recentBatches: [],
      latestSummary: null,
      highRiskEmployees: [],
    }
  }

  if (summaryResult.status === 'rejected' && !isNoDataResponse(summaryResult)) {
    throw summaryResult.reason
  }

  if (
    highRiskResult.status === 'rejected' &&
    !isNoDataResponse(highRiskResult)
  ) {
    throw highRiskResult.reason
  }

  return {
    totalBatches: batchesData.pagination.total,
    recentBatches: batchesData.batches,
    latestSummary:
      summaryResult.status === 'fulfilled'
        ? summaryResult.value.data.data.summary
        : null,
    highRiskEmployees:
      highRiskResult.status === 'fulfilled'
        ? highRiskResult.value.data.data.employees
        : [],
  }
}
