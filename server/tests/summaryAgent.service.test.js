import { describe, expect, test } from '@jest/globals'
import { generateBatchSummary } from '../src/services/summaryAgent.service.js'

describe('summary agent service', () => {
  test('generates a deterministic batch narrative', () => {
    const input = {
      totalRows: 10,
      validRows: 8,
      invalidRows: 2,
      status: 'completed_with_errors',
      aggregateTotals: {
        netPay: 42150.5,
      },
      riskCounts: {
        low: 5,
        medium: 2,
        high: 1,
      },
      mostCommonRiskFlag: {
        code: 'HIGH_DEDUCTION_RATIO',
        count: 2,
      },
      departmentWithHighestNetPay: {
        department: 'Engineering',
        netPay: 18900,
      },
    }

    const expected =
      'Batch status: completed with errors. ' +
      'Processed 10 rows: 8 valid and 2 invalid. ' +
      'Total net pay is 42150.50. ' +
      'Risk distribution is 5 low, 2 medium, and 1 high. ' +
      'Most common risk flag: HIGH_DEDUCTION_RATIO (2 records). ' +
      'Department with highest net pay: Engineering (18900.00).'

    expect(generateBatchSummary(input)).toBe(expected)
    expect(generateBatchSummary(input)).toBe(expected)
  })
})
