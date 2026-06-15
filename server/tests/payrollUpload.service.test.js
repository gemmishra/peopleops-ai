import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from '@jest/globals'
import { buildPayrollBatchResult } from '../src/services/payrollUpload.service.js'
import { parseCsvFile } from '../src/utils/csvParser.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const sampleCsvPath = path.resolve(
  currentDirectory,
  '../../sample-data/payroll-sample.csv',
)

const validRow = {
  employeeId: 'EMP-2001',
  employeeName: 'Avery Morgan',
  department: 'Engineering',
  annualSalary: '96000',
  payFrequency: 'monthly',
  bonus: '0',
  preTaxDeductions: '250',
  taxWithheld: '1800',
  postTaxDeductions: '100',
  payPeriodStart: '2026-05-01',
  payPeriodEnd: '2026-05-31',
}

describe('payroll upload processing service', () => {
  test('creates a completed result when every row is valid', () => {
    const result = buildPayrollBatchResult([
      validRow,
      {
        ...validRow,
        employeeId: 'EMP-2002',
      },
    ])

    expect(result.status).toBe('completed')
    expect(result.validRows).toBe(2)
    expect(result.invalidRows).toBe(0)
    expect(result.employees).toHaveLength(2)
  })

  test('creates a completed_with_errors result for mixed rows', () => {
    const result = buildPayrollBatchResult([
      validRow,
      {
        ...validRow,
        employeeId: 'EMP-2002',
        annualSalary: '-1',
      },
    ])

    expect(result.status).toBe('completed_with_errors')
    expect(result.validRows).toBe(1)
    expect(result.invalidRows).toBe(1)
    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: 'EMP-2002',
          code: 'NON_POSITIVE_ANNUAL_SALARY',
        }),
      ]),
    )
  })

  test('creates a failed result when no rows are valid', () => {
    const result = buildPayrollBatchResult([
      {
        ...validRow,
        annualSalary: 'not-a-number',
      },
    ])

    expect(result.status).toBe('failed')
    expect(result.validRows).toBe(0)
    expect(result.invalidRows).toBe(1)
    expect(result.employees).toEqual([])
  })

  test('sample CSV has the intended row and risk distribution', async () => {
    const parsed = await parseCsvFile(sampleCsvPath)
    const result = buildPayrollBatchResult(parsed.rows)

    expect(result.totalRows).toBe(15)
    expect(result.validRows).toBe(13)
    expect(result.invalidRows).toBe(2)
    expect(result.status).toBe('completed_with_errors')
    expect(result.riskCounts.high).toBeGreaterThanOrEqual(2)
    expect(result.riskCounts.medium).toBeGreaterThanOrEqual(3)
  })
})
