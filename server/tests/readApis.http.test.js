import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

let server
let baseUrl

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '5000',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/peopleops_ai_test',
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    JWT_EXPIRES_IN: '1d',
    ADMIN_NAME: 'PeopleOps Test Admin',
    ADMIN_EMAIL: 'admin-test@example.com',
    ADMIN_PASSWORD: 'test-password-12345',
    CLIENT_ORIGIN: 'http://localhost:5173',
  })

  const { default: app } = await import('../src/app.js')
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
})

describe('read API authentication', () => {
  test.each([
    '/api/payroll/batches',
    '/api/payroll/batches/latest/summary',
    '/api/payroll/batches/latest/high-risk',
    '/api/payroll/employee/EMP-1001/risk',
    '/api/audit-logs',
  ])('protects GET %s', async (path) => {
    const response = await fetch(`${baseUrl}${path}`)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      success: false,
      error: {
        message: 'Authentication required',
      },
    })
  })

  test('protects POST /api/ai/payroll-review/:batchId', async () => {
    const response = await fetch(
      `${baseUrl}/api/ai/payroll-review/507f1f77bcf86cd799439011`,
      {
        method: 'POST',
      },
    )

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      success: false,
      error: {
        message: 'Authentication required',
      },
    })
  })
})
