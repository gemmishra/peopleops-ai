import mongoose from 'mongoose'
import {
  afterEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals'
import AuditLog from '../src/models/AuditLog.js'
import { listAuditLogs } from '../src/services/auditRead.service.js'

const createQuery = (result) => {
  const query = {
    select: jest.fn(),
    populate: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    lean: jest.fn().mockResolvedValue(result),
  }

  for (const method of ['select', 'populate', 'sort', 'skip', 'limit']) {
    query[method].mockReturnValue(query)
  }

  return query
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('audit read service', () => {
  test('returns paginated and sanitized audit records', async () => {
    const logId = new mongoose.Types.ObjectId()
    const userId = new mongoose.Types.ObjectId()
    const query = createQuery([
      {
        _id: logId,
        userId: {
          _id: userId,
          name: 'PeopleOps Admin',
          email: 'admin@example.com',
          role: 'admin',
        },
        action: 'PAYROLL_UPLOAD',
        entityType: 'PayrollBatch',
        entityId: 'batch-1',
        details: {
          originalFileName: 'payroll.csv',
          accessToken: 'must-not-return',
          rows: [{ employeeId: 'EMP-1' }],
        },
        status: 'success',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-05-31T10:00:00.000Z'),
      },
    ])
    const findSpy = jest.spyOn(AuditLog, 'find').mockReturnValue(query)
    jest.spyOn(AuditLog, 'countDocuments').mockResolvedValue(1)

    const result = await listAuditLogs({
      page: '1',
      limit: '10',
      action: 'PAYROLL_UPLOAD',
      status: 'success',
    })

    expect(findSpy).toHaveBeenCalledWith({
      action: 'PAYROLL_UPLOAD',
      status: 'success',
    })
    expect(result.pagination.total).toBe(1)
    expect(result.auditLogs[0].details).toEqual({
      originalFileName: 'payroll.csv',
    })
    expect(result.auditLogs[0].user.email).toBe('admin@example.com')
  })
})
