import { describe, expect, test } from '@jest/globals'
import { uploadPayroll } from '../src/controllers/payroll.controller.js'

describe('payroll controller', () => {
  test('rejects a request without the file field', async () => {
    await expect(uploadPayroll({}, {})).rejects.toMatchObject({
      statusCode: 400,
      code: 'MISSING_FILE',
      message: 'A CSV file is required in multipart field "file"',
    })
  })
})
