import { describe, expect, test } from '@jest/globals'
import {
  validateCsvHeaders,
  validatePayrollRows,
} from '../src/services/validationAgent.service.js'
import { CSV_HEADERS } from '../src/utils/payrollConstants.js'

const validRow = {
  employeeId: 'EMP-100',
  employeeName: 'Avery Morgan',
  department: 'Engineering',
  annualSalary: '96000',
  payFrequency: 'monthly',
  bonus: '500',
  preTaxDeductions: '250',
  taxWithheld: '1800',
  postTaxDeductions: '100',
  payPeriodStart: '2026-05-01',
  payPeriodEnd: '2026-05-31',
}

describe('validation agent service', () => {
  test('accepts only the exact CSV headers in the expected order', () => {
    expect(validateCsvHeaders(CSV_HEADERS)).toEqual({
      valid: true,
      errors: [],
    })

    const reorderedHeaders = [...CSV_HEADERS]
    ;[reorderedHeaders[0], reorderedHeaders[1]] = [
      reorderedHeaders[1],
      reorderedHeaders[0],
    ]

    expect(validateCsvHeaders(reorderedHeaders).valid).toBe(false)
    expect(
      validateCsvHeaders([...CSV_HEADERS, 'unexpected']).valid,
    ).toBe(false)
  })

  test('marks a repeated employee ID row as invalid', () => {
    const result = validatePayrollRows([
      validRow,
      {
        ...validRow,
        employeeName: 'Second Employee',
      },
    ])

    expect(result.validRowCount).toBe(1)
    expect(result.invalidRowCount).toBe(1)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 3,
          employeeId: 'EMP-100',
          field: 'employeeId',
          code: 'DUPLICATE_EMPLOYEE_ID',
        }),
      ]),
    )
  })
})
