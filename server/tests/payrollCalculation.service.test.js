import { describe, expect, test } from '@jest/globals'
import {
  calculatePayroll,
  getFrequencyPeriods,
} from '../src/services/payrollCalculation.service.js'

describe('payroll calculation service', () => {
  test.each([
    ['weekly', 52],
    ['biweekly', 26],
    ['semimonthly', 24],
    ['monthly', 12],
  ])('maps %s to %i periods', (frequency, periods) => {
    expect(getFrequencyPeriods(frequency)).toBe(periods)
  })

  test('calculates and rounds salaried payroll deterministically', () => {
    expect(
      calculatePayroll({
        annualSalary: 100000,
        payFrequency: 'monthly',
        bonus: 500.127,
        preTaxDeductions: 250.555,
        taxWithheld: 1800.335,
        postTaxDeductions: 125.445,
      }),
    ).toEqual({
      periodBasePay: 8333.33,
      grossPay: 8833.46,
      taxablePay: 8582.91,
      netPay: 6657.13,
    })
  })

  test('never returns a negative taxable pay amount', () => {
    expect(
      calculatePayroll({
        annualSalary: 12000,
        payFrequency: 'monthly',
        bonus: 0,
        preTaxDeductions: 1500,
        taxWithheld: 0,
        postTaxDeductions: 0,
      }).taxablePay,
    ).toBe(0)
  })

  test('rejects unsupported pay frequencies', () => {
    expect(() =>
      getFrequencyPeriods('quarterly'),
    ).toThrow('Unsupported pay frequency: quarterly')
  })
})
