import EmployeePayroll from '../models/EmployeePayroll.js'
import PayrollBatch from '../models/PayrollBatch.js'
import { buildBatchAnalytics } from './analytics.service.js'
import { writeAuditLog } from './audit.service.js'
import { calculatePayroll } from './payrollCalculation.service.js'
import { generateRecommendations } from './recommendationAgent.service.js'
import { assessBatchRisk } from './riskDetectionAgent.service.js'
import { generateBatchSummary } from './summaryAgent.service.js'
import {
  validateCsvHeaders,
  validatePayrollRows,
} from './validationAgent.service.js'
import { parseCsvFile } from '../utils/csvParser.js'

const getBatchStatus = (validRows, invalidRows) => {
  if (validRows === 0) {
    return 'failed'
  }

  if (invalidRows > 0) {
    return 'completed_with_errors'
  }

  return 'completed'
}

const formatHeaderErrorsForBatch = (headerErrors) =>
  headerErrors.map((error) => ({
    rowNumber: 1,
    employeeId: null,
    field: 'headers',
    code: error.code,
    message: error.message,
  }))

export const buildPayrollBatchResult = (rows) => {
  const validation = validatePayrollRows(rows)
  const calculatedRows = validation.validRows.map((row) => ({
    ...row,
    ...calculatePayroll(row),
  }))
  const riskResult = assessBatchRisk(calculatedRows)
  const analytics = buildBatchAnalytics(riskResult.rows)
  const status = getBatchStatus(
    validation.validRowCount,
    validation.invalidRowCount,
  )
  const summaryContext = {
    totalRows: validation.totalRows,
    validRows: validation.validRowCount,
    invalidRows: validation.invalidRowCount,
    status,
    ...analytics,
  }
  const summary = generateBatchSummary(summaryContext)
  const recommendations = generateRecommendations({
    invalidRows: validation.invalidRowCount,
    riskCounts: analytics.riskCounts,
    rows: riskResult.rows,
    mostCommonRiskFlag: analytics.mostCommonRiskFlag,
  })

  return {
    status,
    totalRows: validation.totalRows,
    validRows: validation.validRowCount,
    invalidRows: validation.invalidRowCount,
    validationErrors: validation.errors,
    employees: riskResult.rows,
    aggregateTotals: analytics.aggregateTotals,
    riskCounts: analytics.riskCounts,
    summary,
    recommendations,
  }
}

const createInvalidHeadersError = (headerValidation, batch) => {
  const error = new Error('CSV header validation failed')
  error.statusCode = 400
  error.code = 'INVALID_CSV_HEADERS'
  error.details = headerValidation.errors
  error.batchId = batch.id
  return error
}

const createFailedHeaderBatch = async ({
  originalFileName,
  uploadedBy,
  headerValidation,
}) =>
  PayrollBatch.create({
    originalFileName,
    uploadedBy,
    status: 'failed',
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    validationErrors: formatHeaderErrorsForBatch(headerValidation.errors),
    summary:
      'Batch status: failed. CSV headers did not match the required payroll contract.',
    recommendations: [
      'Use the published payroll CSV template and upload the batch again.',
    ],
    processedAt: new Date(),
  })

const createProcessingBatch = ({ originalFileName, uploadedBy }) =>
  PayrollBatch.create({
    originalFileName,
    uploadedBy,
    status: 'processing',
  })

const markBatchFailed = async (batch, message) => {
  batch.status = 'failed'
  batch.summary = `Batch status: failed. ${message}`
  batch.recommendations = [
    'Review the server error and upload the payroll batch again.',
  ]
  batch.processedAt = new Date()
  await batch.save()
}

export const processPayrollUpload = async ({
  filePath,
  originalFileName,
  uploadedBy,
  ipAddress,
}) => {
  const parsedCsv = await parseCsvFile(filePath)
  const headerValidation = validateCsvHeaders(parsedCsv.headers)

  if (!headerValidation.valid) {
    const batch = await createFailedHeaderBatch({
      originalFileName,
      uploadedBy,
      headerValidation,
    })

    await writeAuditLog({
      userId: uploadedBy,
      action: 'PAYROLL_UPLOAD',
      entityType: 'PayrollBatch',
      entityId: batch.id,
      details: {
        originalFileName,
        reason: 'Invalid CSV headers',
        validationErrorCount: headerValidation.errors.length,
      },
      status: 'failure',
      ipAddress,
    })

    throw createInvalidHeadersError(headerValidation, batch)
  }

  const batch = await createProcessingBatch({
    originalFileName,
    uploadedBy,
  })

  try {
    const result = buildPayrollBatchResult(parsedCsv.rows)

    if (result.employees.length > 0) {
      await EmployeePayroll.insertMany(
        result.employees.map((employee) => ({
          ...employee,
          batchId: batch.id,
        })),
      )
    }

    Object.assign(batch, {
      status: result.status,
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      aggregateTotals: result.aggregateTotals,
      riskCounts: result.riskCounts,
      validationErrors: result.validationErrors,
      summary: result.summary,
      recommendations: result.recommendations,
      processedAt: new Date(),
    })
    await batch.save()

    await writeAuditLog({
      userId: uploadedBy,
      action: 'PAYROLL_UPLOAD',
      entityType: 'PayrollBatch',
      entityId: batch.id,
      details: {
        originalFileName,
        status: result.status,
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
      },
      status: result.status === 'failed' ? 'failure' : 'success',
      ipAddress,
    })

    return {
      batch,
      employees: result.employees,
    }
  } catch (error) {
    await EmployeePayroll.deleteMany({ batchId: batch.id })
    await markBatchFailed(batch, 'Payroll processing could not be completed.')

    try {
      await writeAuditLog({
        userId: uploadedBy,
        action: 'PAYROLL_UPLOAD',
        entityType: 'PayrollBatch',
        entityId: batch.id,
        details: {
          originalFileName,
          reason: error.message,
        },
        status: 'failure',
        ipAddress,
      })
    } catch (auditError) {
      console.error('Failed to write payroll upload failure audit', auditError)
    }

    throw error
  }
}
