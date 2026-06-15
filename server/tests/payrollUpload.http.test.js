import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import express from 'express'
import { uploadPayrollCsv } from '../src/middleware/upload.middleware.js'

let apiServer
let apiBaseUrl

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
  apiServer = app.listen(0)
  await new Promise((resolve) => apiServer.once('listening', resolve))
  apiBaseUrl = `http://127.0.0.1:${apiServer.address().port}`
})

afterAll(async () => {
  if (apiServer) {
    await new Promise((resolve) => apiServer.close(resolve))
  }
})

describe('payroll upload HTTP boundary', () => {
  test('requires JWT authentication', async () => {
    const response = await fetch(`${apiBaseUrl}/api/payroll/upload`, {
      method: 'POST',
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      success: false,
      error: {
        message: 'Authentication required',
      },
    })
  })

  test('rejects a non-CSV file', async () => {
    const app = express()
    app.post('/upload', uploadPayrollCsv.single('file'), (_req, res) => {
      res.sendStatus(204)
    })
    app.use((error, _req, res, _next) => {
      res.status(error.statusCode || 500).json({
        code: error.code,
        message: error.message,
      })
    })

    const server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))

    try {
      const form = new FormData()
      form.set(
        'file',
        new Blob(['not a CSV'], { type: 'text/plain' }),
        'payroll.txt',
      )

      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/upload`,
        {
          method: 'POST',
          body: form,
        },
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        code: 'INVALID_FILE_TYPE',
        message: 'Only .csv files are allowed',
      })
    } finally {
      await new Promise((resolve) => server.close(resolve))
    }
  })
})
