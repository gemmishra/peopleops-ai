import {
  CSV_HEADERS,
  PAY_FREQUENCIES,
} from '../utils/payrollConstants.js'

const numericFields = [
  'annualSalary',
  'bonus',
  'preTaxDeductions',
  'taxWithheld',
  'postTaxDeductions',
]

const textFields = ['employeeId', 'employeeName', 'department']
const dateFields = ['payPeriodStart', 'payPeriodEnd']

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === ''

const createError = ({
  rowNumber,
  employeeId,
  field,
  code,
  message,
}) => ({
  rowNumber,
  employeeId: employeeId || null,
  field,
  code,
  message,
})

const parseStrictDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10) === value ? date : null
}

export const validateCsvHeaders = (headers) => {
  const receivedHeaders = Array.isArray(headers) ? headers : []
  const valid =
    receivedHeaders.length === CSV_HEADERS.length &&
    CSV_HEADERS.every((header, index) => receivedHeaders[index] === header)

  if (valid) {
    return {
      valid: true,
      errors: [],
    }
  }

  return {
    valid: false,
    errors: [
      {
        code: 'INVALID_CSV_HEADERS',
        message: `CSV headers must exactly match: ${CSV_HEADERS.join(',')}`,
        expected: [...CSV_HEADERS],
        received: receivedHeaders,
      },
    ],
  }
}

export const validatePayrollRow = (row, rowNumber, seenEmployeeIds) => {
  const errors = []
  const warnings = []
  const employeeId = isBlank(row.employeeId)
    ? null
    : String(row.employeeId).trim()

  for (const field of [...textFields, ...numericFields, ...dateFields, 'payFrequency']) {
    if (isBlank(row[field])) {
      errors.push(
        createError({
          rowNumber,
          employeeId,
          field,
          code: 'REQUIRED_FIELD',
          message: `${field} is required.`,
        }),
      )
    }
  }

  for (const field of textFields) {
    if (!isBlank(row[field]) && String(row[field]).trim().length === 0) {
      errors.push(
        createError({
          rowNumber,
          employeeId,
          field,
          code: 'EMPTY_TEXT',
          message: `${field} must not be empty.`,
        }),
      )
    }
  }

  const normalizedNumbers = {}

  for (const field of numericFields) {
    if (isBlank(row[field])) {
      continue
    }

    const value = Number(row[field])

    if (!Number.isFinite(value)) {
      errors.push(
        createError({
          rowNumber,
          employeeId,
          field,
          code: 'INVALID_NUMBER',
          message: `${field} must be a valid number.`,
        }),
      )
      continue
    }

    if (field === 'annualSalary' && value <= 0) {
      errors.push(
        createError({
          rowNumber,
          employeeId,
          field,
          code: 'NON_POSITIVE_ANNUAL_SALARY',
          message: 'annualSalary must be greater than zero.',
        }),
      )
    } else if (field !== 'annualSalary' && value < 0) {
      errors.push(
        createError({
          rowNumber,
          employeeId,
          field,
          code: 'NEGATIVE_VALUE',
          message: `${field} must be nonnegative.`,
        }),
      )
    }

    normalizedNumbers[field] = value
  }

  if (
    !isBlank(row.payFrequency) &&
    !PAY_FREQUENCIES.includes(String(row.payFrequency).trim())
  ) {
    errors.push(
      createError({
        rowNumber,
        employeeId,
        field: 'payFrequency',
        code: 'INVALID_PAY_FREQUENCY',
        message: `payFrequency must be one of: ${PAY_FREQUENCIES.join(', ')}.`,
      }),
    )
  }

  const payPeriodStart = isBlank(row.payPeriodStart)
    ? null
    : parseStrictDate(String(row.payPeriodStart).trim())
  const payPeriodEnd = isBlank(row.payPeriodEnd)
    ? null
    : parseStrictDate(String(row.payPeriodEnd).trim())

  if (!isBlank(row.payPeriodStart) && !payPeriodStart) {
    errors.push(
      createError({
        rowNumber,
        employeeId,
        field: 'payPeriodStart',
        code: 'INVALID_DATE',
        message: 'payPeriodStart must be a valid YYYY-MM-DD date.',
      }),
    )
  }

  if (!isBlank(row.payPeriodEnd) && !payPeriodEnd) {
    errors.push(
      createError({
        rowNumber,
        employeeId,
        field: 'payPeriodEnd',
        code: 'INVALID_DATE',
        message: 'payPeriodEnd must be a valid YYYY-MM-DD date.',
      }),
    )
  }

  if (payPeriodStart && payPeriodEnd && payPeriodEnd <= payPeriodStart) {
    errors.push(
      createError({
        rowNumber,
        employeeId,
        field: 'payPeriodEnd',
        code: 'INVALID_PAY_PERIOD',
        message: 'payPeriodEnd must be after payPeriodStart.',
      }),
    )
  }

  if (employeeId && seenEmployeeIds.has(employeeId)) {
    errors.push(
      createError({
        rowNumber,
        employeeId,
        field: 'employeeId',
        code: 'DUPLICATE_EMPLOYEE_ID',
        message: 'employeeId is duplicated within this batch.',
      }),
    )
  }

  if (employeeId) {
    seenEmployeeIds.add(employeeId)
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      value: null,
    }
  }

  return {
    valid: true,
    errors,
    warnings,
    value: {
      employeeId,
      employeeName: String(row.employeeName).trim(),
      department: String(row.department).trim(),
      ...normalizedNumbers,
      payFrequency: String(row.payFrequency).trim(),
      payPeriodStart,
      payPeriodEnd,
      validationWarnings: warnings,
    },
  }
}

export const validatePayrollRows = (rows, { startingRowNumber = 2 } = {}) => {
  const seenEmployeeIds = new Set()
  const validRows = []
  const invalidRows = []
  const errors = []

  rows.forEach((row, index) => {
    const rowNumber = startingRowNumber + index
    const result = validatePayrollRow(row, rowNumber, seenEmployeeIds)

    if (result.valid) {
      validRows.push(result.value)
      return
    }

    invalidRows.push({
      rowNumber,
      employeeId: row.employeeId || null,
      errors: result.errors,
    })
    errors.push(...result.errors)
  })

  return {
    validRows,
    invalidRows,
    errors,
    totalRows: rows.length,
    validRowCount: validRows.length,
    invalidRowCount: invalidRows.length,
  }
}
