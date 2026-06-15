import { describe, expect, test } from '@jest/globals'
import {
  assessBatchRisk,
  assessPayrollRisk,
  calculateSalaryStatistics,
  getRiskLevel,
} from '../src/services/riskDetectionAgent.service.js'

const baseRow = {
  annualSalary: 72000,
  periodBasePay: 6000,
  grossPay: 6000,
  netPay: 4500,
  bonus: 0,
  preTaxDeductions: 300,
  taxWithheld: 1000,
  postTaxDeductions: 200,
  validationWarnings: [],
}

const stableStatistics = {
  mean: 72000,
  standardDeviation: 10000,
}

const flagCodes = (result) => result.riskFlags.map((flag) => flag.code)

describe('risk detection agent service', () => {
  test('adds 40 points when net pay is zero or negative', () => {
    const result = assessPayrollRisk(
      {
        ...baseRow,
        netPay: 0,
      },
      stableStatistics,
    )

    expect(result.riskScore).toBe(40)
    expect(flagCodes(result)).toContain('NON_POSITIVE_NET_PAY')
  })

  test('adds 25 points when deductions exceed 40% of gross pay', () => {
    const result = assessPayrollRisk(
      {
        ...baseRow,
        preTaxDeductions: 1000,
        taxWithheld: 1300,
        postTaxDeductions: 200,
      },
      stableStatistics,
    )

    expect(result.riskScore).toBe(25)
    expect(flagCodes(result)).toContain('HIGH_DEDUCTION_RATIO')
  })

  test('adds 20 points when bonus exceeds 20% of period base pay', () => {
    const result = assessPayrollRisk(
      {
        ...baseRow,
        bonus: 1200.01,
        grossPay: 7200.01,
        netPay: 5700.01,
      },
      stableStatistics,
    )

    expect(result.riskScore).toBe(20)
    expect(flagCodes(result)).toContain('HIGH_BONUS_RATIO')
  })

  test.each([
    [0, 'low'],
    [29, 'low'],
    [30, 'medium'],
    [59, 'medium'],
    [60, 'high'],
    [100, 'high'],
  ])('maps risk score %i to %s', (score, level) => {
    expect(getRiskLevel(score)).toBe(level)
  })

  test('returns safe statistics for an empty batch', () => {
    expect(calculateSalaryStatistics([])).toEqual({
      mean: 0,
      standardDeviation: 0,
    })
    expect(assessBatchRisk([])).toEqual({
      rows: [],
      salaryStatistics: {
        mean: 0,
        standardDeviation: 0,
      },
    })
  })

  test('caps combined risk at 100', () => {
    const result = assessPayrollRisk(
      {
        ...baseRow,
        annualSalary: 120000,
        netPay: -100,
        bonus: 2000,
        grossPay: 8000,
        preTaxDeductions: 2000,
        taxWithheld: 1500,
        postTaxDeductions: 500,
        validationWarnings: [
          {
            code: 'REVIEW',
          },
        ],
      },
      {
        mean: 72000,
        standardDeviation: 20000,
      },
    )

    expect(result.riskScore).toBe(100)
    expect(result.riskLevel).toBe('high')
  })
})
