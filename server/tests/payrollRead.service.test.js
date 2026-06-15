import mongoose from 'mongoose'
import {
  afterEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import EmployeePayroll from '../src/models/EmployeePayroll.js'
import PayrollBatch from '../src/models/PayrollBatch.js'
import {
  getLatestBatchSummary,
  getLatestEmployeeRisk,
  getLatestHighRiskEmployees,
  getPayrollBatch,
  listBatchEmployees,
  listPayrollBatches,
} from '../src/services/payrollRead.service.js'

const createQuery = (result) => {
  const query = {
    select: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    populate: jest.fn(),
    lean: jest.fn().mockResolvedValue(result),
  }

  for (const method of ['select', 'sort', 'skip', 'limit', 'populate']) {
    query[method].mockReturnValue(query)
  }

  return query
}

const batchId = new mongoose.Types.ObjectId()

afterEach(() => {
  jest.restoreAllMocks()
})

describe('payroll read service', () => {
  test('returns paginated batches in recent-first order', async () => {
    const query = createQuery([
      {
        _id: batchId,
        originalFileName: 'payroll.csv',
        status: 'completed',
        totalRows: 10,
        validRows: 10,
        invalidRows: 0,
        aggregateTotals: { netPay: 1000 },
        riskCounts: { low: 10, medium: 0, high: 0 },
        processedAt: new Date('2026-05-31T10:00:00.000Z'),
        createdAt: new Date('2026-05-31T09:00:00.000Z'),
      },
    ])
    const findSpy = jest.spyOn(PayrollBatch, 'find').mockReturnValue(query)
    jest.spyOn(PayrollBatch, 'countDocuments').mockResolvedValue(3)

    const result = await listPayrollBatches({
      page: '2',
      limit: '1',
      status: 'completed',
      from: '2026-05-01',
      to: '2026-05-31',
    })

    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        createdAt: {
          $gte: new Date('2026-05-01T00:00:00.000Z'),
          $lte: new Date('2026-05-31T23:59:59.999Z'),
        },
      }),
    )
    expect(query.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: -1,
    })
    expect(query.skip).toHaveBeenCalledWith(1)
    expect(result.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    })
    expect(result.batches[0].id).toBe(String(batchId))
  })

  test('rejects invalid calendar dates in batch filters', async () => {
    await expect(
      listPayrollBatches({
        from: '2026-02-30',
      }),
    ).rejects.toMatchObject({
      name: 'ZodError',
    })
  })

  test('returns 404 for an invalid or missing batch identifier', async () => {
    await expect(getPayrollBatch('not-an-object-id')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Payroll batch not found',
    })

    const query = createQuery(null)
    jest.spyOn(PayrollBatch, 'findById').mockReturnValue(query)

    await expect(
      getPayrollBatch(String(batchId)),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Payroll batch not found',
    })
  })

  test('filters batch employees by risk level', async () => {
    jest.spyOn(PayrollBatch, 'exists').mockResolvedValue({ _id: batchId })
    const query = createQuery([
      {
        _id: new mongoose.Types.ObjectId(),
        employeeId: 'EMP-1001',
        employeeName: 'Avery Morgan',
        department: 'Engineering',
        riskScore: 70,
        riskLevel: 'high',
        riskFlags: [],
        validationWarnings: [],
      },
    ])
    const findSpy = jest
      .spyOn(EmployeePayroll, 'find')
      .mockReturnValue(query)
    jest.spyOn(EmployeePayroll, 'countDocuments').mockResolvedValue(1)

    const result = await listBatchEmployees(String(batchId), {
      riskLevel: 'high',
      page: '1',
      limit: '20',
      sort: 'riskScore',
    })

    expect(findSpy).toHaveBeenCalledWith({
      batchId: String(batchId),
      riskLevel: 'high',
    })
    expect(query.sort).toHaveBeenCalledWith({
      riskScore: -1,
      _id: 1,
    })
    expect(result.employees).toHaveLength(1)
    expect(result.employees[0].riskLevel).toBe('high')
  })

  test('returns the latest batch summary', async () => {
    const query = createQuery({
      _id: batchId,
      originalFileName: 'latest.csv',
      status: 'completed_with_errors',
      totalRows: 15,
      validRows: 13,
      invalidRows: 2,
      summary: 'Deterministic summary.',
      recommendations: ['Review errors.'],
      validationErrors: [{ code: 'INVALID_DATE' }],
      riskCounts: { low: 8, medium: 3, high: 2 },
      aggregateTotals: { netPay: 50000 },
      processedAt: new Date(),
      createdAt: new Date(),
    })
    jest.spyOn(PayrollBatch, 'findOne').mockReturnValue(query)

    const result = await getLatestBatchSummary()

    expect(query.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: -1,
    })
    expect(result.id).toBe(String(batchId))
    expect(result.validationErrorCount).toBe(1)
  })

  test('returns high-risk employees from the latest batch', async () => {
    const latestBatchQuery = createQuery({
      _id: batchId,
      originalFileName: 'latest.csv',
      status: 'completed',
      processedAt: new Date(),
    })
    jest.spyOn(PayrollBatch, 'findOne').mockReturnValue(latestBatchQuery)
    const employeesQuery = createQuery([
      {
        _id: new mongoose.Types.ObjectId(),
        employeeId: 'EMP-HIGH',
        employeeName: 'High Risk',
        department: 'Finance',
        riskScore: 80,
        riskLevel: 'high',
        riskFlags: [],
        validationWarnings: [],
      },
    ])
    const findSpy = jest
      .spyOn(EmployeePayroll, 'find')
      .mockReturnValue(employeesQuery)

    const result = await getLatestHighRiskEmployees()

    expect(findSpy).toHaveBeenCalledWith({
      batchId,
      riskLevel: 'high',
    })
    expect(result.count).toBe(1)
    expect(result.employees[0].employeeId).toBe('EMP-HIGH')
  })

  test('returns the latest risk record for an employee', async () => {
    const employeeQuery = createQuery({
      _id: new mongoose.Types.ObjectId(),
      employeeId: 'EMP-1001',
      employeeName: 'Avery Morgan',
      department: 'Engineering',
      annualSalary: 100000,
      grossPay: 9000,
      netPay: 5000,
      riskScore: 60,
      riskLevel: 'high',
      riskFlags: [{ code: 'HIGH_DEDUCTION_RATIO' }],
      validationWarnings: [],
      batchId: {
        _id: batchId,
        originalFileName: 'latest.csv',
        status: 'completed',
        processedAt: new Date(),
        createdAt: new Date(),
      },
    })
    const findSpy = jest
      .spyOn(EmployeePayroll, 'findOne')
      .mockReturnValue(employeeQuery)

    const result = await getLatestEmployeeRisk(' EMP-1001 ')

    expect(findSpy).toHaveBeenCalledWith({
      employeeId: 'EMP-1001',
    })
    expect(employeeQuery.sort).toHaveBeenCalledWith({
      createdAt: -1,
      _id: -1,
    })
    expect(result.employeeId).toBe('EMP-1001')
    expect(result.batch.id).toBe(String(batchId))
  })
})
