import { describe, expect, test } from '@jest/globals'
import { sanitizeAuditDetails } from '../src/services/audit.service.js'

describe('audit service', () => {
  test('removes secrets and uploaded row content from audit details', () => {
    expect(
      sanitizeAuditDetails({
        batchId: 'batch-1',
        password: 'hidden',
        accessToken: 'hidden',
        csvContent: 'hidden',
        rows: [{ employeeId: 'EMP-100' }],
        metadata: {
          validRows: 12,
          authorization: 'hidden',
        },
      }),
    ).toEqual({
      batchId: 'batch-1',
      metadata: {
        validRows: 12,
      },
    })
  })
})
