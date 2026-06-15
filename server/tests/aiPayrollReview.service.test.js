import { describe, expect, jest, test } from '@jest/globals'
import {
  buildGeminiRequest,
  buildPayrollReviewContext,
  callGeminiPayrollReview,
} from '../src/services/aiPayrollReview.service.js'
import { buildAiReviewAuditDetails } from '../src/controllers/ai.controller.js'

const context = {
  batch: {
    id: 'batch-1',
    status: 'completed_with_errors',
    riskCounts: { low: 5, medium: 2, high: 1 },
  },
  selectedEmployees: [],
}

describe('AI payroll review service', () => {
  test('builds compact context from stored batch and risk facts', () => {
    const result = buildPayrollReviewContext(
      {
        _id: 'batch-1',
        status: 'completed',
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        aggregateTotals: { grossPay: 5000, netPay: 3500 },
        riskCounts: { low: 0, medium: 0, high: 1 },
        validationErrors: [],
        summary: 'One high-risk employee requires review.',
        recommendations: ['Review deduction amounts.'],
      },
      [
        {
          employeeId: 'EMP-1',
          employeeName: 'Avery Morgan',
          department: 'Finance',
          grossPay: 5000,
          netPay: -100,
          bonus: 0,
          preTaxDeductions: 300,
          taxWithheld: 4500,
          postTaxDeductions: 300,
          riskScore: 65,
          riskLevel: 'high',
          riskFlags: [
            {
              code: 'NON_POSITIVE_NET_PAY',
              message: 'Net pay is zero or negative.',
              severity: 'high',
              scoreImpact: 40,
            },
          ],
          password: 'must-not-appear',
        },
      ],
    )

    expect(result.batch.validationErrorCount).toBe(0)
    expect(result.selectedEmployees).toHaveLength(1)
    expect(result.selectedEmployees[0]).toEqual(
      expect.objectContaining({
        employeeId: 'EMP-1',
        riskLevel: 'high',
        riskScore: 65,
      }),
    )
    expect(result.selectedEmployees[0]).not.toHaveProperty('password')
  })

  test('prompt forbids calculation, approval, and legal or tax advice', () => {
    const request = buildGeminiRequest(context)
    const instruction = request.systemInstruction.parts[0].text

    expect(instruction).toContain('Do not calculate or recalculate salary')
    expect(instruction).toContain('Do not change records')
    expect(instruction).toContain('approve payroll')
    expect(instruction).toContain('legal or tax advice')
  })

  test('returns 503 without a Gemini API key', async () => {
    const fetchImpl = jest.fn()

    await expect(
      callGeminiPayrollReview({
        context,
        apiKey: '',
        fetchImpl,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_NOT_CONFIGURED',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  test('calls Gemini with the key in a header and returns review text', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Review the flagged deductions.' }],
            },
          },
        ],
      }),
    })

    const review = await callGeminiPayrollReview({
      context,
      apiKey: 'test-gemini-key',
      model: 'gemini-2.5-flash',
      fetchImpl,
    })

    expect(review).toBe('Review the flagged deductions.')
    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).not.toContain('test-gemini-key')
    expect(options.headers['x-goog-api-key']).toBe('test-gemini-key')
    expect(options.body).not.toContain('test-gemini-key')
  })

  test('logs only safe Gemini metadata when the provider rejects a request', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: jest.fn().mockResolvedValue({
        error: {
          message: 'Quota exceeded for this model.',
          details: {
            prompt: 'must-not-be-logged',
            apiKey: 'must-not-be-logged',
          },
        },
      }),
    })

    try {
      await expect(
        callGeminiPayrollReview({
          context,
          apiKey: 'test-gemini-key',
          model: 'gemini-2.5-flash',
          fetchImpl,
        }),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: 'AI_PROVIDER_ERROR',
        message: 'AI payroll review provider rejected the request',
      })

      expect(consoleError).toHaveBeenCalledWith(
        'Gemini payroll review request failed',
        {
          status: 429,
          statusText: 'Too Many Requests',
          model: 'gemini-2.5-flash',
          providerMessage: 'Quota exceeded for this model.',
        },
      )

      const loggedValue = JSON.stringify(consoleError.mock.calls)
      expect(loggedValue).not.toContain('test-gemini-key')
      expect(loggedValue).not.toContain('must-not-be-logged')
      expect(loggedValue).not.toContain(JSON.stringify(context))
    } finally {
      consoleError.mockRestore()
    }
  })

  test('limits audit details to approved review metadata', () => {
    expect(
      buildAiReviewAuditDetails({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        selectedEmployeeCount: 3,
        riskCounts: { low: 4, medium: 2, high: 1 },
        prompt: 'must-not-be-logged',
        review: 'must-not-be-logged',
        apiKey: 'must-not-be-logged',
      }),
    ).toEqual({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      selectedEmployeeCount: 3,
      riskCounts: { low: 4, medium: 2, high: 1 },
    })
  })
})
